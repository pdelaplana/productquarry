import { z } from 'zod';

// Authentication schemas
export const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// OTP authentication schemas
export const sendOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const verifyOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
  token: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must contain only numbers'),
});

// Board schemas
export const createBoardSchema = z.object({
  name: z.string().min(3, 'Board name must be at least 3 characters'),
  description: z.string().optional(),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  is_public: z.boolean().default(false),
  requires_approval: z.boolean().default(true),
});

export const updateBoardSchema = createBoardSchema.partial();

// Feedback schemas
export const feedbackTypeSchema = z.enum(['bug', 'improvement', 'feedback']);
export const feedbackStatusSchema = z.enum(['open', 'in_progress', 'completed', 'declined']);

export const createFeedbackSchema = z.object({
  board_slug: z.string().min(1, 'Board slug is required'),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: feedbackTypeSchema,
  user_email: z.union([z.string().email('Invalid email address'), z.literal('')]).optional(),
});

export const updateFeedbackSchema = z.object({
  status: feedbackStatusSchema.optional(),
  is_approved: z.boolean().optional(),
});

// Comment schemas
export const createCommentSchema = z.object({
  feedback_id: z.string().uuid('Invalid feedback ID'),
  content: z
    .string()
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be 1000 characters or less'),
});

export const updateCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be 1000 characters or less'),
});

// Type exports
export type SignUpData = z.infer<typeof signUpSchema>;
export type SignInData = z.infer<typeof signInSchema>;
export type SendOTPData = z.infer<typeof sendOTPSchema>;
export type VerifyOTPData = z.infer<typeof verifyOTPSchema>;
export type CreateBoardData = z.input<typeof createBoardSchema>;
export type UpdateBoardData = z.infer<typeof updateBoardSchema>;
export type CreateFeedbackData = z.infer<typeof createFeedbackSchema>;
export type UpdateFeedbackData = z.infer<typeof updateFeedbackSchema>;
export type CreateCommentData = z.infer<typeof createCommentSchema>;
export type UpdateCommentData = z.infer<typeof updateCommentSchema>;
