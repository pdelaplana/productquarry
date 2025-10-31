'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import {
  type CreateBoardData,
  createBoardSchema,
  type UpdateBoardData,
  updateBoardSchema,
} from '@/lib/validations';
import { withSentryServerAction } from './sentryServerAction';

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Creates a new board for the authenticated user
 */
export const createBoard = withSentryServerAction(
  'createBoard',
  async (
    userId: string,
    data: CreateBoardData
  ): Promise<ActionResult<{ id: string; slug: string }>> => {
    try {
      const supabaseAdmin = getSupabaseAdmin();

      // Validate input
      const validatedData = createBoardSchema.parse(data);

      // Create board in database
      const { data: board, error } = await supabaseAdmin
        .from('boards')
        .insert({
          customer_id: userId,
          name: validatedData.name,
          description: validatedData.description || null,
          slug: validatedData.slug,
          is_public: validatedData.is_public ?? true,
          requires_approval: validatedData.requires_approval ?? false,
        })
        .select('id, slug')
        .single();

      if (error) {
        console.error('Error creating board:', error);
        return { success: false, error: error.message || 'Failed to create board' };
      }

      // Revalidate dashboard page
      revalidatePath('/dashboard');

      return { success: true, data: board };
    } catch (error) {
      console.error('Error in createBoard action:', error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
);

/**
 * Updates an existing board's settings
 */
export const updateBoard = withSentryServerAction(
  'updateBoard',
  async (
    userId: string,
    boardId: string,
    data: UpdateBoardData
  ): Promise<ActionResult<{ slug: string }>> => {
    try {
      const supabaseAdmin = getSupabaseAdmin();

      // Validate input
      const validatedData = updateBoardSchema.parse(data);

      // First verify the board belongs to the user
      const { data: board, error: fetchError } = await supabaseAdmin
        .from('boards')
        .select('customer_id, slug')
        .eq('id', boardId)
        .single();

      if (fetchError) {
        console.error('Error fetching board:', fetchError);
        return { success: false, error: 'Board not found' };
      }

      if (board.customer_id !== userId) {
        return { success: false, error: 'Unauthorized to update this board' };
      }

      // Update the board
      const { error: updateError } = await supabaseAdmin
        .from('boards')
        .update({
          name: validatedData.name,
          description: validatedData.description || null,
          slug: validatedData.slug,
          is_public: validatedData.is_public,
          requires_approval: validatedData.requires_approval,
        })
        .eq('id', boardId);

      if (updateError) {
        console.error('Error updating board:', updateError);
        return { success: false, error: updateError.message || 'Failed to update board' };
      }

      // Revalidate relevant pages
      revalidatePath('/dashboard');
      revalidatePath(`/${board.slug}`);
      revalidatePath(`/${board.slug}/dashboard`);
      revalidatePath(`/${board.slug}/settings`);

      // If slug changed, revalidate new slug paths too
      if (validatedData.slug && validatedData.slug !== board.slug) {
        revalidatePath(`/${validatedData.slug}`);
        revalidatePath(`/${validatedData.slug}/dashboard`);
        revalidatePath(`/${validatedData.slug}/settings`);
      }

      return { success: true, data: { slug: validatedData.slug || board.slug } };
    } catch (error) {
      console.error('Error in updateBoard action:', error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
);

/**
 * Deletes a board and all associated data
 */
export const deleteBoard = withSentryServerAction(
  'deleteBoard',
  async (userId: string, boardId: string): Promise<ActionResult<void>> => {
    try {
      const supabaseAdmin = getSupabaseAdmin();

      // First verify the board belongs to the user
      const { data: board, error: fetchError } = await supabaseAdmin
        .from('boards')
        .select('customer_id')
        .eq('id', boardId)
        .single();

      if (fetchError) {
        console.error('Error fetching board:', fetchError);
        return { success: false, error: 'Board not found' };
      }

      if (board.customer_id !== userId) {
        return { success: false, error: 'Unauthorized to delete this board' };
      }

      // Delete the board (cascade should handle related records)
      const { error: deleteError } = await supabaseAdmin.from('boards').delete().eq('id', boardId);

      if (deleteError) {
        console.error('Error deleting board:', deleteError);
        return { success: false, error: deleteError.message || 'Failed to delete board' };
      }

      // Revalidate dashboard page
      revalidatePath('/dashboard');

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error in deleteBoard action:', error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
);

/**
 * Fetches all boards for a user
 */
export const getUserBoards = withSentryServerAction('getUserBoards', async (userId: string) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: boards, error } = await supabaseAdmin
      .from('boards')
      .select('*')
      .eq('customer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching boards:', error);
      return { success: false, error: error.message || 'Failed to fetch boards' };
    }

    return { success: true, data: boards };
  } catch (error) {
    console.error('Error in getUserBoards action:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
});

/**
 * Fetches a single board by slug
 */
export const getBoardBySlug = withSentryServerAction(
  'getBoardBySlug',
  async (slug: string, userId?: string) => {
    try {
      const supabaseAdmin = getSupabaseAdmin();

      const { data: board, error } = await supabaseAdmin
        .from('boards')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Error fetching board:', error);
        return { success: false, error: 'Board not found' };
      }

      // If userId is provided, verify ownership for dashboard access
      if (userId && board.customer_id !== userId) {
        return { success: false, error: 'Unauthorized access to this board' };
      }

      return { success: true, data: board };
    } catch (error) {
      console.error('Error in getBoardBySlug action:', error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
);
