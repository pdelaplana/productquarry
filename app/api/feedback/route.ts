import { type NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { createFeedbackSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const validationResult = createFeedbackSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid feedback data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { board_slug, title, description, type, user_email } = validationResult.data;

    const supabaseAdmin = getSupabaseAdmin();

    // Get the board by slug
    const { data: board, error: boardError } = await supabaseAdmin
      .from('boards')
      .select('id, requires_approval')
      .eq('slug', board_slug)
      .single();

    if (boardError || !board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Type assertion to workaround TypeScript control flow limitations
    const boardData = board as { id: string; requires_approval: boolean };

    // Create the feedback
    const { data: feedback, error: feedbackError } = await supabaseAdmin
      .from('feedback')
      .insert({
        board_id: boardData.id,
        title,
        description,
        type,
        user_email: user_email || null,
        is_approved: !boardData.requires_approval, // Auto-approve if board doesn't require approval
        status: 'open',
      })
      .select()
      .single();

    if (feedbackError) {
      console.error('Feedback creation error:', feedbackError);
      return NextResponse.json({ error: 'Failed to create feedback' }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        message: board.requires_approval
          ? 'Feedback submitted successfully and is pending approval'
          : 'Feedback submitted successfully',
        feedback,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
