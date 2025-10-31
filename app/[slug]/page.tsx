'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUp, ChevronDown, MessageSquare, Plus, Search as SearchIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import Script from 'next/script';
import { useMemo, useState } from 'react';
import { CommentForm } from '@/components/comment-form';
import { CommentItem } from '@/components/comment-item';
import { EmailAuthDialog } from '@/components/email-auth-dialog';
import { FeedbackForm } from '@/components/feedback-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/providers/auth-provider';
import { getBoardBySlug } from '@/server/actions/board-actions';
import { getComments } from '@/server/actions/comment-actions';
import { getBoardFeedbackPublic } from '@/server/actions/feedback-actions';
import { getUserVotes, toggleVote } from '@/server/actions/vote-actions';
import type { Board, Feedback } from '@/types/database';

export default function PublicBoardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [filter, setFilter] = useState<'all' | 'bug' | 'improvement' | 'feedback'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'trending' | 'newest' | 'oldest'>('trending');

  // Fetch board
  const { data: board, isLoading: boardLoading } = useQuery({
    queryKey: ['board', slug],
    queryFn: async () => {
      const result = await getBoardBySlug(slug);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Type assertions to workaround TypeScript discriminated union control flow limitations
      const successResult = result as { success: true; data: Board };
      const boardData = successResult.data;

      if (!boardData || !boardData.is_public) {
        throw new Error(boardData ? 'Board is not public' : 'Board not found');
      }

      return boardData;
    },
  });

  // Fetch feedback
  const { data: feedbackList, isLoading: feedbackLoading } = useQuery({
    queryKey: ['feedback', slug, filter],
    queryFn: async () => {
      if (!board) return [];

      const result = await getBoardFeedbackPublic(board.id, filter);

      if (!result.success) {
        throw new Error(result.error);
      }

      console.log(
        'Feedback fetched:',
        result.data?.map((f) => ({ id: f.id, title: f.title, vote_count: f.vote_count }))
      );

      return result.data as Feedback[];
    },
    enabled: !!board,
    staleTime: 0, // Always refetch to see changes immediately
  });

  // Get feedback IDs for stable query key
  const feedbackIds = useMemo(() => feedbackList?.map((f) => f.id) || [], [feedbackList]);

  // Fetch user votes for the displayed feedback
  const { data: userVotes } = useQuery({
    queryKey: ['user-votes', slug, feedbackIds],
    queryFn: async () => {
      if (feedbackIds.length === 0) return {};

      const result = await getUserVotes(feedbackIds);

      if (!result.success) {
        return {};
      }

      return result.data;
    },
    enabled: feedbackIds.length > 0,
    staleTime: 0, // Always consider data stale so it refetches
  });

  // Filter and sort feedback
  const filteredFeedback = useMemo(() => {
    if (!feedbackList) return [];

    let filtered = feedbackList;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((f) => f.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (f) => f.title.toLowerCase().includes(query) || f.description.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered];
    if (sortBy === 'newest') {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === 'trending') {
      // Sort by vote count (most votes first)
      sorted.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
    }

    return sorted;
  }, [feedbackList, statusFilter, searchQuery, sortBy]);

  // Vote toggle mutation
  const voteMutation = useMutation({
    mutationFn: async (feedbackId: string) => {
      console.log('Calling toggleVote server action', { feedbackId, slug });
      const result = await toggleVote(feedbackId, slug);
      console.log('toggleVote result:', result);

      if (!result.success) {
        console.error('toggleVote failed:', result.error);
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: async (data) => {
      console.log('Vote toggle successful:', data);
      toast({
        title: 'Success',
        description: data.hasVoted ? 'Vote added' : 'Vote removed',
      });

      // Invalidate all feedback and vote queries for this board
      await queryClient.invalidateQueries({
        queryKey: ['feedback', slug],
        exact: false, // Match all queries starting with ['feedback', slug]
      });
      await queryClient.invalidateQueries({
        queryKey: ['user-votes', slug],
        exact: false, // Match all queries starting with ['user-votes', slug]
      });

      console.log('Queries invalidated, data should update automatically');
    },
    onError: (error: Error) => {
      console.error('Vote mutation error:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle vote button click
  const handleVote = (feedbackId: string) => {
    console.log('Vote button clicked', { feedbackId, user: !!user });

    if (!user) {
      console.log('User not authenticated, opening auth dialog');
      setAuthDialogOpen(true);
      return;
    }

    console.log('Triggering vote mutation');
    voteMutation.mutate(feedbackId);
  };

  if (boardLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading board...</p>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Board Not Found</h1>
          <p className="text-muted-foreground">
            This feedback board doesn't exist or is not public.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Tabs */}
      <div className="sticky top-16 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList className="bg-transparent border-0 h-auto p-0">
              <TabsTrigger
                value="all"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent px-4 py-3"
              >
                All Feedback
              </TabsTrigger>
              <TabsTrigger
                value="bug"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent px-4 py-3"
              >
                Bugs
              </TabsTrigger>
              <TabsTrigger
                value="improvement"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent px-4 py-3"
              >
                Improvements
              </TabsTrigger>
              <TabsTrigger
                value="feedback"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent px-4 py-3"
              >
                Reviews
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">
                {filter === 'all'
                  ? 'All Feedback'
                  : filter === 'bug'
                    ? 'Bug Reports'
                    : filter === 'improvement'
                      ? 'Feature Requests'
                      : 'Customer Reviews'}
              </h1>
              <p className="text-muted-foreground">
                {board.description || 'Share your thoughts and help us improve'}
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Submit Feedback
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit Feedback</DialogTitle>
                  <DialogDescription>
                    Share your thoughts, report bugs, or suggest improvements.
                  </DialogDescription>
                </DialogHeader>
                <FeedbackForm boardSlug={slug} onSuccess={() => setIsDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search feedback..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Status
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                  All Statuses
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('open')}>Open</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('in_progress')}>
                  In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('completed')}>
                  Completed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('declined')}>
                  Declined
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  {sortBy === 'trending' ? 'Trending' : sortBy === 'newest' ? 'Newest' : 'Oldest'}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy('trending')}>Trending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('newest')}>Newest</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('oldest')}>Oldest</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Feedback List */}
        {feedbackLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading feedback...</p>
          </div>
        ) : filteredFeedback && filteredFeedback.length > 0 ? (
          <div>
            {filteredFeedback.map((feedback) => (
              <div
                key={feedback.id}
                className="bg-card border-b p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedFeedback(feedback);
                  setCommentsDialogOpen(true);
                }}
              >
                <div className="flex gap-4">
                  {/* Vote Count */}
                  <div className="flex flex-col items-center gap-1 min-w-[40px]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleVote(feedback.id);
                      }}
                      disabled={voteMutation.isPending}
                      className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                        userVotes?.[feedback.id]
                          ? 'text-primary'
                          : 'text-muted-foreground hover:text-primary'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <ArrowUp className="h-5 w-5" />
                      <span className="text-sm font-semibold">{feedback.vote_count || 0}</span>
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1">{feedback.title}</h3>
                    <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                      {feedback.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span
                        className={`px-2 py-0.5 rounded font-medium ${
                          feedback.status === 'open'
                            ? 'bg-gray-100 text-gray-700'
                            : feedback.status === 'in_progress'
                              ? 'bg-yellow-100 text-yellow-700'
                              : feedback.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {feedback.status.replace('_', ' ')}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(feedback.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      {feedback.user_email && (
                        <>
                          <span>•</span>
                          <span>{feedback.user_email}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Comment Count - Clickable */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFeedback(feedback);
                      setCommentsDialogOpen(true);
                    }}
                    className="flex items-start gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <MessageSquare className="h-4 w-4 mt-0.5" />
                    <span className="text-sm font-medium">{feedback.comment_count || 0}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-semibold mb-2">No feedback found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Be the first to share your thoughts!'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Submit Feedback
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Structured Data for SEO */}
      {board && (
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              name: board.name,
              description: board.description || `Feedback board for ${board.name}`,
              url: typeof window !== 'undefined' ? window.location.href : '',
              mainEntity: {
                '@type': 'CreativeWork',
                name: `${board.name} Feedback`,
                description: board.description || 'Community feedback and suggestions',
              },
            }),
          }}
        />
      )}

      {/* Auth Dialog */}
      <EmailAuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['user-votes', slug] });
          toast({
            title: 'Success',
            description: 'You can now vote on feedback',
          });
        }}
      />

      {/* Comments Dialog */}
      <CommentsDialog
        open={commentsDialogOpen}
        onOpenChange={setCommentsDialogOpen}
        feedback={selectedFeedback}
        boardSlug={slug}
        onAuthRequired={() => setAuthDialogOpen(true)}
      />
    </div>
  );
}

// Comments Dialog Component
function CommentsDialog({
  open,
  onOpenChange,
  feedback,
  boardSlug,
  onAuthRequired,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedback: Feedback | null;
  boardSlug: string;
  onAuthRequired: () => void;
}) {
  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', feedback?.id],
    queryFn: async () => {
      if (!feedback) return [];
      const result = await getComments(feedback.id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!feedback && open,
  });

  if (!feedback) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 flex flex-col">
        <div className="grid grid-cols-2 flex-1 overflow-hidden">
          {/* Left Section - Feedback Details (Fixed) */}
          <div className="p-6 border-r bg-muted/30 overflow-y-auto">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl">{feedback.title}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Description</h3>
                <p className="text-sm">{feedback.description}</p>
              </div>

              {/* Metadata */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Type</h3>
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      feedback.type === 'bug'
                        ? 'bg-red-100 text-red-700'
                        : feedback.type === 'improvement'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {feedback.type}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Status</h3>
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      feedback.status === 'open'
                        ? 'bg-gray-100 text-gray-700'
                        : feedback.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-700'
                          : feedback.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {feedback.status === 'in_progress' ? 'In Progress' : feedback.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Votes</h3>
                  <p className="text-sm">{feedback.vote_count || 0}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Submitted</h3>
                  <p className="text-sm">
                    {new Date(feedback.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                {feedback.user_email && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                      Submitted by
                    </h3>
                    <p className="text-sm">{feedback.user_email}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Section - Comments (Scrollable) */}
          <div className="flex flex-col min-h-0">
            {/* Comment Form - Fixed at top */}
            <div className="p-6 border-b bg-background">
              <h3 className="text-lg font-semibold mb-4">Discussion</h3>
              <CommentForm
                feedbackId={feedback.id}
                boardSlug={boardSlug}
                onAuthRequired={() => {
                  onOpenChange(false);
                  onAuthRequired();
                }}
              />
            </div>

            {/* Comments List - Scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Loading comments...</p>
                </div>
              ) : comments && comments.length > 0 ? (
                <div className="space-y-0 divide-y">
                  {comments.map((comment) => (
                    <div key={comment.id} className="py-4 first:pt-0">
                      <CommentItem comment={comment} boardSlug={boardSlug} isBoardOwner={false} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No comments yet. Be the first to post!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
