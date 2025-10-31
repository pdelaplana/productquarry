'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { CommentForm } from '@/components/comment-form';
import { CommentItem } from '@/components/comment-item';
import { Button } from '@/components/ui/button';
import { getComments } from '@/server/actions/comment-actions';

interface CommentSectionProps {
  feedbackId: string;
  boardSlug: string;
  isBoardOwner?: boolean;
  onAuthRequired: () => void;
}

export function CommentSection({
  feedbackId,
  boardSlug,
  isBoardOwner = false,
  onAuthRequired,
}: CommentSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch comments
  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', feedbackId],
    queryFn: async () => {
      const result = await getComments(feedbackId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: isExpanded, // Only fetch when expanded
  });

  const commentCount = comments?.length || 0;

  return (
    <div className="border-t pt-2">
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between text-muted-foreground hover:text-foreground"
      >
        <span className="text-sm">
          {isExpanded ? 'Hide' : 'Show'} Comments ({commentCount})
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Comment Form */}
          <CommentForm
            feedbackId={feedbackId}
            boardSlug={boardSlug}
            onAuthRequired={onAuthRequired}
          />

          {/* Comments List */}
          {isLoading ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Loading comments...</p>
            </div>
          ) : comments && comments.length > 0 ? (
            <div className="space-y-0">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  boardSlug={boardSlug}
                  isBoardOwner={isBoardOwner}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-4 border-2 border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground">
                No comments yet. Be the first to comment!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
