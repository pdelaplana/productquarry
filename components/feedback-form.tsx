'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { type CreateFeedbackData, createFeedbackSchema } from '@/lib/validations';
import { submitFeedback } from '@/server/actions/feedback-actions';

interface FeedbackFormProps {
  boardSlug: string;
  onSuccess?: () => void;
}

export function FeedbackForm({ boardSlug, onSuccess }: FeedbackFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [feedbackType, setFeedbackType] = useState<'bug' | 'improvement' | 'feedback'>('feedback');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateFeedbackData>({
    resolver: zodResolver(createFeedbackSchema),
    defaultValues: {
      board_slug: boardSlug,
      type: 'feedback',
    },
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: CreateFeedbackData) => {
      const result = await submitFeedback(data);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['feedback', boardSlug] });
      toast({
        title: 'Success',
        description: data.requiresApproval
          ? 'Feedback submitted successfully and is pending approval'
          : 'Feedback submitted successfully',
      });
      reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit feedback',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CreateFeedbackData) => {
    submitFeedbackMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type">Feedback Type</Label>
        <Select
          value={feedbackType}
          onValueChange={(value: 'bug' | 'improvement' | 'feedback') => {
            setFeedbackType(value);
            setValue('type', value);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bug">Bug Report</SelectItem>
            <SelectItem value="improvement">Improvement</SelectItem>
            <SelectItem value="feedback">General Feedback</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Brief summary of your feedback"
          {...register('title')}
          disabled={submitFeedbackMutation.isPending}
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Provide details about your feedback"
          rows={4}
          {...register('description')}
          disabled={submitFeedbackMutation.isPending}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="user_email">Email (optional)</Label>
        <Input
          id="user_email"
          type="email"
          placeholder="your.email@example.com"
          {...register('user_email')}
          disabled={submitFeedbackMutation.isPending}
        />
        <p className="text-xs text-muted-foreground">
          We'll only use this to follow up on your feedback
        </p>
        {errors.user_email && (
          <p className="text-sm text-destructive">{errors.user_email.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={submitFeedbackMutation.isPending}>
        {submitFeedbackMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
      </Button>
    </form>
  );
}
