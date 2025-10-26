import { z } from "zod";

// Authentication schemas
export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Board schemas
export const createBoardSchema = z.object({
  name: z.string().min(3, "Board name must be at least 3 characters"),
  description: z.string().optional(),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  is_public: z.boolean().default(false),
  requires_approval: z.boolean().default(true),
});

export const updateBoardSchema = createBoardSchema.partial();

// Feedback schemas
export const feedbackTypeSchema = z.enum(["bug", "improvement", "feedback"]);
export const feedbackStatusSchema = z.enum(["open", "in_progress", "completed", "declined"]);

export const createFeedbackSchema = z.object({
  boardSlug: z.string().min(1, "Board slug is required"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: feedbackTypeSchema,
  user_email: z.string().email("Invalid email address").optional(),
});

export const updateFeedbackSchema = z.object({
  status: feedbackStatusSchema.optional(),
  is_approved: z.boolean().optional(),
});

// Type exports
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>;
