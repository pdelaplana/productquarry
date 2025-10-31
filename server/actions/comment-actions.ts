'use server';

import { revalidatePath } from 'next/cache';
import { createCommentSchema, updateCommentSchema } from '@/lib/validations';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Comment } from '@/types/database';
import { withSentryServerAction } from './sentryServerAction';

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Create a new comment on feedback
 * Requires authentication via OTP (like voting)
 */
export const createComment = withSentryServerAction(
  'createComment',
  async (feedbackId: string, content: string, boardSlug: string): Promise<ActionResult<Comment>> => {
    try {
      const supabase = await createSupabaseServerClient();

      // Get the authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return { success: false, error: 'You must be signed in to comment' };
      }

      const userEmail = user.email;
      if (!userEmail) {
        return { success: false, error: 'User email not found' };
      }

      // Validate input
      const validation = createCommentSchema.safeParse({ feedback_id: feedbackId, content });
      if (!validation.success) {
        return { success: false, error: validation.error.issues[0].message };
      }

      // Verify feedback exists and is approved
      const { data: feedback, error: feedbackError } = await supabase
        .from('feedback')
        .select('id, is_approved')
        .eq('id', feedbackId)
        .single();

      if (feedbackError || !feedback) {
        return { success: false, error: 'Feedback not found' };
      }

      if (!feedback.is_approved) {
        return { success: false, error: 'Cannot comment on unapproved feedback' };
      }

      // Create comment
      const { data: comment, error: insertError } = await supabase
        .from('comments')
        .insert({
          feedback_id: feedbackId,
          user_email: userEmail,
          content: validation.data.content,
          is_official: false,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating comment:', insertError);
        return { success: false, error: 'Failed to create comment' };
      }

      // Revalidate the board page
      revalidatePath(`/${boardSlug}`);

      return { success: true, data: comment };
    } catch (error) {
      console.error('Error in createComment action:', error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
);

/**
 * Update own comment content
 * Users can only update their own comments
 */
export const updateComment = withSentryServerAction(
  'updateComment',
  async (commentId: string, content: string, boardSlug: string): Promise<ActionResult<Comment>> => {
    try {
      const supabase = await createSupabaseServerClient();

      // Get the authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return { success: false, error: 'You must be signed in to update comments' };
      }

      const userEmail = user.email;
      if (!userEmail) {
        return { success: false, error: 'User email not found' };
      }

      // Validate input
      const validation = updateCommentSchema.safeParse({ content });
      if (!validation.success) {
        return { success: false, error: validation.error.issues[0].message };
      }

      // Verify comment ownership
      const { data: existingComment, error: fetchError } = await supabase
        .from('comments')
        .select('user_email')
        .eq('id', commentId)
        .single();

      if (fetchError || !existingComment) {
        return { success: false, error: 'Comment not found' };
      }

      if (existingComment.user_email !== userEmail) {
        return { success: false, error: 'You can only update your own comments' };
      }

      // Update comment
      const { data: comment, error: updateError } = await supabase
        .from('comments')
        .update({ content: validation.data.content })
        .eq('id', commentId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating comment:', updateError);
        return { success: false, error: 'Failed to update comment' };
      }

      // Revalidate the board page
      revalidatePath(`/${boardSlug}`);

      return { success: true, data: comment };
    } catch (error) {
      console.error('Error in updateComment action:', error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
);

/**
 * Delete a comment
 * Users can delete their own comments, board owners can delete any comment
 */
export const deleteComment = withSentryServerAction(
  'deleteComment',
  async (commentId: string, boardSlug: string): Promise<ActionResult<void>> => {
    try {
      const supabase = await createSupabaseServerClient();

      // Get the authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return { success: false, error: 'You must be signed in to delete comments' };
      }

      // RLS policies will handle authorization
      // Users can delete own comments, board owners can delete any comment on their boards
      const { error: deleteError } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (deleteError) {
        console.error('Error deleting comment:', deleteError);
        return { success: false, error: 'Failed to delete comment or you do not have permission' };
      }

      // Revalidate the board page
      revalidatePath(`/${boardSlug}`);

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error in deleteComment action:', error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
);

/**
 * Mark a comment as official response (board owners only)
 */
export const markAsOfficial = withSentryServerAction(
  'markAsOfficial',
  async (commentId: string, isOfficial: boolean, boardSlug: string): Promise<ActionResult<Comment>> => {
    try {
      const supabase = await createSupabaseServerClient();

      // Get the authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return { success: false, error: 'You must be signed in to mark comments as official' };
      }

      // Get the comment with board info to verify ownership
      const { data: commentData, error: fetchError } = await supabase
        .from('comments')
        .select(`
          id,
          feedback_id,
          feedback!inner(
            board_id,
            boards!inner(
              customer_id
            )
          )
        `)
        .eq('id', commentId)
        .single();

      if (fetchError || !commentData) {
        return { success: false, error: 'Comment not found' };
      }

      // Check if user is the board owner
      const boardCustomerId = (commentData.feedback as any).boards.customer_id;
      if (boardCustomerId !== user.id) {
        return { success: false, error: 'Only board owners can mark comments as official' };
      }

      // Update comment official status
      const { data: comment, error: updateError } = await supabase
        .from('comments')
        .update({ is_official: isOfficial })
        .eq('id', commentId)
        .select()
        .single();

      if (updateError) {
        console.error('Error marking comment as official:', updateError);
        return { success: false, error: 'Failed to update comment' };
      }

      // Revalidate the board page
      revalidatePath(`/${boardSlug}`);

      return { success: true, data: comment };
    } catch (error) {
      console.error('Error in markAsOfficial action:', error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
);

/**
 * Get all comments for a feedback item
 */
export const getComments = withSentryServerAction(
  'getComments',
  async (feedbackId: string): Promise<ActionResult<Comment[]>> => {
    try {
      const supabase = await createSupabaseServerClient();

      const { data: comments, error } = await supabase
        .from('comments')
        .select('*')
        .eq('feedback_id', feedbackId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        return { success: false, error: 'Failed to fetch comments' };
      }

      return { success: true, data: comments || [] };
    } catch (error) {
      console.error('Error in getComments action:', error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
);

/**
 * Get comment count for a feedback item
 */
export const getCommentCount = withSentryServerAction(
  'getCommentCount',
  async (feedbackId: string): Promise<ActionResult<number>> => {
    try {
      const supabase = await createSupabaseServerClient();

      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('feedback_id', feedbackId);

      if (error) {
        console.error('Error counting comments:', error);
        return { success: false, error: 'Failed to count comments' };
      }

      return { success: true, data: count || 0 };
    } catch (error) {
      console.error('Error in getCommentCount action:', error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
);
