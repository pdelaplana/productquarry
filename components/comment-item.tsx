'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Award, Edit2, MoreVertical, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/providers/auth-provider';
import { deleteComment, markAsOfficial, updateComment } from '@/server/actions/comment-actions';
import type { Comment } from '@/types/database';

interface CommentItemProps {
  comment: Comment;
  boardSlug: string;
  isBoardOwner?: boolean;
}

export function CommentItem({ comment, boardSlug, isBoardOwner = false }: CommentItemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isOwner = user?.email === comment.user_email;
  const canEdit = isOwner;
  const canDelete = isOwner || isBoardOwner;

  // Update comment mutation
  const updateMutation = useMutation({
    mutationFn: async (content: string) => {
      const result = await updateComment(comment.id, content, boardSlug);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', comment.feedback_id] });
      toast({
        title: 'Success',
        description: 'Comment updated',
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete comment mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const result = await deleteComment(comment.id, boardSlug);
      if (!result.success) {
        throw new Error(result.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', comment.feedback_id] });
      queryClient.invalidateQueries({ queryKey: ['feedback', boardSlug] });
      toast({
        title: 'Success',
        description: 'Comment deleted',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mark as official mutation
  const officialMutation = useMutation({
    mutationFn: async (isOfficial: boolean) => {
      const result = await markAsOfficial(comment.id, isOfficial, boardSlug);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', comment.feedback_id] });
      toast({
        title: 'Success',
        description: comment.is_official
          ? 'Removed official status'
          : 'Marked as official response',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleUpdate = () => {
    if (editedContent.trim().length === 0) {
      toast({
        title: 'Error',
        description: 'Comment cannot be empty',
        variant: 'destructive',
      });
      return;
    }
    if (editedContent.length > 1000) {
      toast({
        title: 'Error',
        description: 'Comment must be 1000 characters or less',
        variant: 'destructive',
      });
      return;
    }
    updateMutation.mutate(editedContent);
  };

  const handleCancelEdit = () => {
    setEditedContent(comment.content);
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <>
      <div className="border-b last:border-0 py-4 first:pt-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{comment.user_email}</span>
            <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
            {comment.edited_at && (
              <span className="text-xs text-muted-foreground italic">(edited)</span>
            )}
            {comment.is_official && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                <Award className="h-3 w-3" />
                Official Response
              </span>
            )}
          </div>

          {(canEdit || canDelete || isBoardOwner) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <>
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {isBoardOwner && (
                  <>
                    <DropdownMenuItem
                      onClick={() => officialMutation.mutate(!comment.is_official)}
                      disabled={officialMutation.isPending}
                    >
                      <Award className="mr-2 h-4 w-4" />
                      {comment.is_official ? 'Remove Official Status' : 'Mark as Official'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[80px]"
              maxLength={1000}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {editedContent.length}/1000 characters
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleUpdate} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteMutation.mutate();
                setDeleteDialogOpen(false);
              }}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
