'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { type CreateFeedbackData, createFeedbackSchema } from '@/lib/validations';
import type { Feedback } from '@/types/database';
import { withSentryServerAction } from './sentryServerAction';

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Submits new feedback to a board
 */
export const submitFeedback = withSentryServerAction(
  'submitFeedback',
  async (data: CreateFeedbackData): Promise<ActionResult<{ requiresApproval: boolean }>> => {
    try {
      // Validate input
      const validatedData = createFeedbackSchema.parse(data);

      // Get the board by slug
      const { data: board, error: boardError } = await supabaseAdmin
        .from('boards')
        .select('id, requires_approval')
        .eq('slug', validatedData.board_slug)
        .single();

      if (boardError || !board) {
        console.error('Error fetching board:', boardError);
        return { success: false, error: 'Board not found' };
      }

      // Create the feedback
      const { error: feedbackError } = await supabaseAdmin.from('feedback').insert({
        board_id: board.id,
        title: validatedData.title,
        description: validatedData.description,
        type: validatedData.type,
        user_email: validatedData.user_email || null,
        is_approved: !board.requires_approval,
        status: 'open',
      });

      if (feedbackError) {
        console.error('Error creating feedback:', feedbackError);
        return { success: false, error: feedbackError.message || 'Failed to submit feedback' };
      }

      // Revalidate the board pages
      revalidatePath(`/${validatedData.board_slug}`);
      revalidatePath(`/${validatedData.board_slug}/dashboard`);

      return {
        success: true,
        data: { requiresApproval: board.requires_approval },
      };
    } catch (error) {
      console.error('Error in submitFeedback action:', error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
);

/**
 * Fetches public feedback for a board (only approved feedback)
 */
export const getBoardFeedbackPublic = withSentryServerAction(
  'getBoardFeedbackPublic',
  async (
    boardId: string,
    filterType?: 'all' | 'bug' | 'improvement' | 'feedback'
  ): Promise<ActionResult<Feedback[]>> => {
    try {
      // Build query for approved feedback only
      let query = supabaseAdmin
        .from('feedback')
        .select('*')
        .eq('board_id', boardId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (filterType && filterType !== 'all') {
        query = query.eq('type', filterType);
      }

      const { data: feedback, error } = await query;

      if (error) {
        console.error('Error fetching public feedback:', error);
        return { success: false, error: error.message || 'Failed to fetch feedback' };
      }

      return { success: true, data: feedback || [] };
    } catch (error) {
      console.error('Error in getBoardFeedbackPublic action:', error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
);

/**
 * Fetches feedback for a board (admin view with all feedback including unapproved)
 */
export const getBoardFeedbackAdmin = withSentryServerAction(
  'getBoardFeedbackAdmin',
  async (
    userId: string,
    boardId: string,
    filterView?: 'all' | 'pending' | 'approved'
  ): Promise<ActionResult<Feedback[]>> => {
    try {
      // First verify the board belongs to the user
      const { data: board, error: boardError } = await supabaseAdmin
        .from('boards')
        .select('customer_id')
        .eq('id', boardId)
        .single();

      if (boardError || !board) {
        console.error('Error fetching board:', boardError);
        return { success: false, error: 'Board not found' };
      }

      if (board.customer_id !== userId) {
        return { success: false, error: 'Unauthorized access to board feedback' };
      }

      // Build query based on filter
      let query = supabaseAdmin
        .from('feedback')
        .select('*')
        .eq('board_id', boardId)
        .order('created_at', { ascending: false });

      if (filterView === 'pending') {
        query = query.eq('is_approved', false);
      } else if (filterView === 'approved') {
        query = query.eq('is_approved', true);
      }

      const { data: feedback, error } = await query;

      if (error) {
        console.error('Error fetching feedback:', error);
        return { success: false, error: error.message || 'Failed to fetch feedback' };
      }

      return { success: true, data: feedback || [] };
    } catch (error) {
      console.error('Error in getBoardFeedbackAdmin action:', error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
);

/**
 * Approves a feedback item
 */
export const approveFeedback = withSentryServerAction(
  'approveFeedback',
  async (userId: string, feedbackId: string, boardSlug: string): Promise<ActionResult<void>> => {
    try {
      // First verify the feedback belongs to a board owned by this user
      const { data: feedback, error: fetchError } = await supabaseAdmin
        .from('feedback')
        .select('board_id, boards!inner(customer_id, slug)')
        .eq('id', feedbackId)
        .single();

      if (fetchError) {
        console.error('Error fetching feedback:', fetchError);
        return { success: false, error: 'Feedback not found' };
      }

      // @ts-expect-error - Supabase types don't handle nested relations well
      if (feedback.boards.customer_id !== userId) {
        return { success: false, error: 'Unauthorized to approve this feedback' };
      }

      // Approve the feedback
      const { error: updateError } = await supabaseAdmin
        .from('feedback')
        .update({ is_approved: true })
        .eq('id', feedbackId);

      if (updateError) {
        console.error('Error approving feedback:', updateError);
        return { success: false, error: updateError.message || 'Failed to approve feedback' };
      }

      // Revalidate the board pages
      revalidatePath(`/${boardSlug}`);
      revalidatePath(`/${boardSlug}/dashboard`);

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error in approveFeedback action:', error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
);

/**
 * Updates the status of a feedback item
 */
export const updateFeedbackStatus = withSentryServerAction(
  'updateFeedbackStatus',
  async (
    userId: string,
    feedbackId: string,
    status: string,
    boardSlug: string
  ): Promise<ActionResult<void>> => {
    try {
      // Validate status
      const validStatuses = ['open', 'in_progress', 'completed', 'declined'];
      if (!validStatuses.includes(status)) {
        return { success: false, error: 'Invalid status value' };
      }

      // First verify the feedback belongs to a board owned by this user
      const { data: feedback, error: fetchError } = await supabaseAdmin
        .from('feedback')
        .select('board_id, boards!inner(customer_id, slug)')
        .eq('id', feedbackId)
        .single();

      if (fetchError) {
        console.error('Error fetching feedback:', fetchError);
        return { success: false, error: 'Feedback not found' };
      }

      // @ts-expect-error - Supabase types don't handle nested relations well
      if (feedback.boards.customer_id !== userId) {
        return { success: false, error: 'Unauthorized to update this feedback' };
      }

      // Update the status
      const { error: updateError } = await supabaseAdmin
        .from('feedback')
        .update({ status })
        .eq('id', feedbackId);

      if (updateError) {
        console.error('Error updating feedback status:', updateError);
        return { success: false, error: updateError.message || 'Failed to update status' };
      }

      // Revalidate the board pages
      revalidatePath(`/${boardSlug}`);
      revalidatePath(`/${boardSlug}/dashboard`);

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error in updateFeedbackStatus action:', error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
);

/**
 * Deletes a feedback item
 */
export const deleteFeedback = withSentryServerAction(
  'deleteFeedback',
  async (userId: string, feedbackId: string, boardSlug: string): Promise<ActionResult<void>> => {
    try {
      // First verify the feedback belongs to a board owned by this user
      const { data: feedback, error: fetchError } = await supabaseAdmin
        .from('feedback')
        .select('board_id, boards!inner(customer_id, slug)')
        .eq('id', feedbackId)
        .single();

      if (fetchError) {
        console.error('Error fetching feedback:', fetchError);
        return { success: false, error: 'Feedback not found' };
      }

      // @ts-expect-error - Supabase types don't handle nested relations well
      if (feedback.boards.customer_id !== userId) {
        return { success: false, error: 'Unauthorized to delete this feedback' };
      }

      // Delete the feedback
      const { error: deleteError } = await supabaseAdmin
        .from('feedback')
        .delete()
        .eq('id', feedbackId);

      if (deleteError) {
        console.error('Error deleting feedback:', deleteError);
        return { success: false, error: deleteError.message || 'Failed to delete feedback' };
      }

      // Revalidate the board pages
      revalidatePath(`/${boardSlug}`);
      revalidatePath(`/${boardSlug}/dashboard`);

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error in deleteFeedback action:', error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
);
