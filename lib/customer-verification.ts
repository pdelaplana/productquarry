'use server';

import { createSupabaseServerClient, getSupabaseAdmin } from './supabase/server';

/**
 * Verifies if the currently authenticated user is a customer (board owner)
 * Returns the customer record if found, null otherwise
 */
export async function verifyCustomer() {
  try {
    const supabase = await createSupabaseServerClient();

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Check if this user is a customer
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('email', user.email)
      .maybeSingle();

    if (customerError) {
      console.error('Error checking customer status:', customerError);
      return null;
    }

    return customer;
  } catch (error) {
    console.error('Error in verifyCustomer:', error);
    return null;
  }
}

/**
 * Checks if the currently authenticated user is a customer
 * Returns true if they are a customer, false otherwise
 */
export async function isCustomer(): Promise<boolean> {
  const customer = await verifyCustomer();
  return customer !== null;
}

/**
 * Verifies if the currently authenticated user owns a specific board
 */
export async function verifyBoardOwnership(boardId: string): Promise<boolean> {
  try {
    const customer = await verifyCustomer();

    if (!customer) {
      return false;
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Check if the board belongs to this customer
    const { data: board, error: boardError } = await supabaseAdmin
      .from('boards')
      .select('customer_id')
      .eq('id', boardId)
      .maybeSingle();

    if (boardError || !board) {
      console.error('Error checking board ownership:', boardError);
      return false;
    }

    return board.customer_id === customer.id;
  } catch (error) {
    console.error('Error in verifyBoardOwnership:', error);
    return false;
  }
}

/**
 * Verifies if the currently authenticated user owns a board by slug
 */
export async function verifyBoardOwnershipBySlug(boardSlug: string): Promise<boolean> {
  try {
    const customer = await verifyCustomer();

    if (!customer) {
      return false;
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Check if the board belongs to this customer
    const { data: board, error: boardError } = await supabaseAdmin
      .from('boards')
      .select('customer_id')
      .eq('slug', boardSlug)
      .maybeSingle();

    if (boardError || !board) {
      console.error('Error checking board ownership:', boardError);
      return false;
    }

    return board.customer_id === customer.id;
  } catch (error) {
    console.error('Error in verifyBoardOwnershipBySlug:', error);
    return false;
  }
}
