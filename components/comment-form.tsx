'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/providers/auth-provider';
import { createComment } from '@/server/actions/comment-actions';

interface CommentFormProps {
  feedbackId: string;
  boardSlug: string;
  onAuthRequired: () => void;
}

export function CommentForm({ feedbackId, boardSlug, onAuthRequired }: CommentFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Create comment mutation
  const createMutation = useMutation({
    mutationFn: async (commentContent: string) => {
      const result = await createComment(feedbackId, commentContent, boardSlug);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', feedbackId] });
      queryClient.invalidateQueries({ queryKey: ['feedback', boardSlug] });
      toast({
        title: 'Success',
        description: 'Comment posted',
      });
      setContent('');
      setIsFocused(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check authentication
    if (!user) {
      onAuthRequired();
      return;
    }

    // Validate content
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      toast({
        title: 'Error',
        description: 'Please enter a comment',
        variant: 'destructive',
      });
      return;
    }

    if (trimmedContent.length > 1000) {
      toast({
        title: 'Error',
        description: 'Comment must be 1000 characters or less',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate(trimmedContent);
  };

  const handleCancel = () => {
    setContent('');
    setIsFocused(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder={user ? 'Write a comment...' : 'Sign in to comment'}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onFocus={() => setIsFocused(true)}
        className="min-h-[80px] resize-none"
        maxLength={1000}
        disabled={!user || createMutation.isPending}
      />

      {(isFocused || content.length > 0) && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{content.length}/1000 characters</span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!user || content.trim().length === 0 || createMutation.isPending}
            >
              {createMutation.isPending ? 'Posting...' : 'Comment'}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
