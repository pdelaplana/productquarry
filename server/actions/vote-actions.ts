'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, supabaseAdmin } from '@/lib/supabase/server';
import { withSentryServerAction } from './sentryServerAction';

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Toggles a vote for a feedback item
 * If user has already voted, removes the vote
 * If user hasn't voted, adds the vote
 */
export const toggleVote = withSentryServerAction(
  'toggleVote',
  async (feedbackId: string, boardSlug: string): Promise<ActionResult<{ hasVoted: boolean; voteCount: number }>> => {
    try {
      const supabase = await createSupabaseServerClient();

      // Get the authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return { success: false, error: 'You must be signed in to vote' };
      }

      const userEmail = user.email;
      if (!userEmail) {
        return { success: false, error: 'User email not found' };
      }

      // Check if vote already exists
      const { data: existingVote, error: checkError } = await supabase
        .from('votes')
        .select('id')
        .eq('feedback_id', feedbackId)
        .eq('user_email', userEmail)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing vote:', checkError);
        return { success: false, error: 'Failed to check vote status' };
      }

      if (existingVote) {
        // Remove vote
        const { error: deleteError } = await supabase
          .from('votes')
          .delete()
          .eq('id', existingVote.id);

        if (deleteError) {
          console.error('Error removing vote:', deleteError);
          return { success: false, error: 'Failed to remove vote' };
        }
      } else {
        // Add vote
        const { error: insertError } = await supabase
          .from('votes')
          .insert({
            feedback_id: feedbackId,
            user_email: userEmail,
          });

        if (insertError) {
          console.error('Error adding vote:', insertError);
          return { success: false, error: 'Failed to add vote' };
        }
      }

      // Get updated vote count (using admin client for reliable read)
      const { data: feedback, error: feedbackError } = await supabaseAdmin
        .from('feedback')
        .select('vote_count')
        .eq('id', feedbackId)
        .single();

      if (feedbackError || !feedback) {
        console.error('Error fetching updated vote count:', feedbackError);
        // Still return success since the vote was toggled
        return {
          success: true,
          data: {
            hasVoted: !existingVote,
            voteCount: 0,
          },
        };
      }

      // Revalidate the board page
      revalidatePath(`/${boardSlug}`);

      return {
        success: true,
        data: {
          hasVoted: !existingVote,
          voteCount: feedback.vote_count,
        },
      };
    } catch (error) {
      console.error('Error in toggleVote action:', error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
);

/**
 * Gets the vote status for a specific feedback item for the current user
 */
export const getUserVote = withSentryServerAction(
  'getUserVote',
  async (feedbackId: string): Promise<ActionResult<{ hasVoted: boolean }>> => {
    try {
      const supabase = await createSupabaseServerClient();

      // Get the authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        // Not authenticated, so hasn't voted
        return { success: true, data: { hasVoted: false } };
      }

      const userEmail = user.email;
      if (!userEmail) {
        return { success: true, data: { hasVoted: false } };
      }

      // Check if vote exists
      const { data: vote, error: voteError } = await supabase
        .from('votes')
        .select('id')
        .eq('feedback_id', feedbackId)
        .eq('user_email', userEmail)
        .maybeSingle();

      if (voteError) {
        console.error('Error checking vote status:', voteError);
        return { success: false, error: 'Failed to check vote status' };
      }

      return {
        success: true,
        data: { hasVoted: !!vote },
      };
    } catch (error) {
      console.error('Error in getUserVote action:', error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
);

/**
 * Gets all votes for the current user for multiple feedback items
 * Used to efficiently check vote status for a list of feedback items
 */
export const getUserVotes = withSentryServerAction(
  'getUserVotes',
  async (feedbackIds: string[]): Promise<ActionResult<Record<string, boolean>>> => {
    try {
      const supabase = await createSupabaseServerClient();

      // Get the authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error('Auth error in getUserVotes:', authError);
      }

      if (authError || !user) {
        // Not authenticated, return all false (this is not an error)
        const result: Record<string, boolean> = {};
        feedbackIds.forEach((id) => {
          result[id] = false;
        });
        return { success: true, data: result };
      }

      const userEmail = user.email;
      if (!userEmail) {
        const result: Record<string, boolean> = {};
        feedbackIds.forEach((id) => {
          result[id] = false;
        });
        return { success: true, data: result };
      }

      // Get all votes for these feedback items
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('feedback_id')
        .in('feedback_id', feedbackIds)
        .eq('user_email', userEmail);

      if (votesError) {
        console.error('Error fetching user votes:', votesError, {
          code: votesError.code,
          message: votesError.message,
          details: votesError.details,
          hint: votesError.hint,
        });
        // Return empty votes instead of failing - this allows the page to still work
        const result: Record<string, boolean> = {};
        feedbackIds.forEach((id) => {
          result[id] = false;
        });
        return { success: true, data: result };
      }

      // Create a map of feedback_id -> hasVoted
      const result: Record<string, boolean> = {};
      feedbackIds.forEach((id) => {
        result[id] = false;
      });

      votes?.forEach((vote) => {
        result[vote.feedback_id] = true;
      });

      return { success: true, data: result };
    } catch (error) {
      console.error('Error in getUserVotes action:', error);
      // Return empty votes instead of failing
      const result: Record<string, boolean> = {};
      feedbackIds.forEach((id) => {
        result[id] = false;
      });
      return { success: true, data: result };
    }
  }
);
