// Database types will be generated from Supabase schema

export interface Customer {
  id: string;
  email: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Board {
  id: string;
  customer_id: string;
  name: string;
  description: string | null;
  slug: string;
  is_public: boolean;
  requires_approval: boolean;
  created_at: string;
}

export interface Feedback {
  id: string;
  board_id: string;
  title: string;
  description: string;
  type: 'bug' | 'improvement' | 'feedback';
  status: 'open' | 'in_progress' | 'completed' | 'declined';
  user_email: string | null;
  is_approved: boolean;
  vote_count: number;
  comment_count: number;
  created_at: string;
}

export interface Vote {
  id: string;
  feedback_id: string;
  user_email: string;
  created_at: string;
}

export interface Comment {
  id: string;
  feedback_id: string;
  user_email: string;
  content: string;
  is_official: boolean;
  edited_at: string | null;
  created_at: string;
}

export type FeedbackType = Feedback['type'];
export type FeedbackStatus = Feedback['status'];
