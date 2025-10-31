'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  MoreVertical,
  Search,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CommentItem } from '@/components/comment-item';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { verifyBoardOwnershipBySlug } from '@/lib/customer-verification';
import { useAuth } from '@/lib/providers/auth-provider';
import { getBoardBySlug } from '@/server/actions/board-actions';
import { getComments } from '@/server/actions/comment-actions';
import {
  approveFeedback,
  deleteFeedback,
  getBoardFeedbackAdmin,
  updateFeedbackStatus,
} from '@/server/actions/feedback-actions';
import type { Board, Feedback } from '@/types/database';

export default function BoardDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null);
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'date',
      desc: true, // newest first by default
    },
  ]);
  const [searchText, setSearchText] = useState('');
  const [selectedApprovalStatuses, setSelectedApprovalStatuses] = useState<string[]>([
    'approved',
    'pending',
  ]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    'open',
    'in_progress',
    'completed',
    'declined',
  ]);

  // Fetch board and check ownership
  const { data: board, isLoading: boardLoading } = useQuery({
    queryKey: ['board', slug],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const result = await getBoardBySlug(slug, user.id);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data as Board;
    },
    enabled: !!user,
  });

  // Check if user is authenticated and is a customer who owns this board
  useEffect(() => {
    const checkAccess = async () => {
      if (!authLoading && !user) {
        router.push('/auth/login');
        return;
      }

      if (user && !boardLoading) {
        const isOwner = await verifyBoardOwnershipBySlug(slug);
        if (!isOwner) {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to access this page.',
            variant: 'destructive',
          });
          router.push(`/${slug}`);
        }
      }
    };

    checkAccess();
  }, [user, authLoading, boardLoading, slug, router, toast]);

  // Fetch all feedback (including unapproved)
  const { data: feedbackList, isLoading: feedbackLoading } = useQuery({
    queryKey: ['feedback-admin', slug],
    queryFn: async () => {
      if (!board || !user) return [];

      const result = await getBoardFeedbackAdmin(user.id, board.id, 'all');

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data as Feedback[];
    },
    enabled: !!board && !!user,
  });

  // Filter feedback based on search and filters
  const filteredFeedback = useMemo(() => {
    if (!feedbackList) return [];

    return feedbackList.filter((feedback) => {
      // Text search filter (title and email)
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const titleMatch = feedback.title.toLowerCase().includes(searchLower);
        const emailMatch = feedback.user_email?.toLowerCase().includes(searchLower);
        if (!titleMatch && !emailMatch) return false;
      }

      // Approval status filter
      if (selectedApprovalStatuses.length > 0) {
        const isApproved = feedback.is_approved;
        const showApproved = selectedApprovalStatuses.includes('approved');
        const showPending = selectedApprovalStatuses.includes('pending');

        // Only show if the feedback matches one of the selected approval statuses
        if (isApproved && !showApproved) return false;
        if (!isApproved && !showPending) return false;
      }

      // Feedback status filter
      if (!selectedStatuses.includes(feedback.status)) return false;

      return true;
    });
  }, [feedbackList, searchText, selectedApprovalStatuses, selectedStatuses]);

  // Define table columns
  const columns: ColumnDef<Feedback>[] = [
    {
      accessorKey: 'created_at',
      id: 'date',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Date
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue('date'));
        return (
          <div className="text-sm text-muted-foreground">
            {date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        );
      },
      size: 50,
      meta: {
        headerClassName: 'w-[50px]',
        cellClassName: '',
      },
    },
    {
      accessorKey: 'title',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Title
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const feedback = row.original;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Type Badge */}
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  feedback.type === 'bug'
                    ? 'bg-red-100 text-red-700'
                    : feedback.type === 'improvement'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                }`}
              >
                {feedback.type}
              </span>
              <span className="font-medium">{feedback.title}</span>
              {!feedback.is_approved && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                  Pending
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{feedback.description}</p>
          </div>
        );
      },
      size: 400,
      meta: {
        headerClassName: 'w-full md:w-1/3',
        cellClassName: '',
      },
    },
    {
      accessorKey: 'user_email',
      id: 'email',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Email
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const email = row.getValue('email') as string | null;
        return (
          <div className="text-sm">
            {email || <span className="text-muted-foreground">Anonymous</span>}
          </div>
        );
      },
      size: 50,
      meta: {
        headerClassName: 'hidden md:table-cell',
        cellClassName: 'hidden md:table-cell',
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Status
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              status === 'open'
                ? 'bg-gray-100 text-gray-700'
                : status === 'in_progress'
                  ? 'bg-blue-100 text-blue-700'
                  : status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
            }`}
          >
            {status === 'in_progress' ? 'In Progress' : status}
          </span>
        );
      },
      size: 50,
      meta: {
        headerClassName: 'hidden md:table-cell',
        cellClassName: 'hidden md:table-cell',
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const feedback = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedFeedback(feedback);
                    setCommentsDialogOpen(true);
                  }}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  View/Manage Comments ({feedback.comment_count || 0})
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {!feedback.is_approved && (
                  <>
                    <DropdownMenuItem
                      onClick={() => approveFeedbackMutation.mutate(feedback.id)}
                      disabled={approveFeedbackMutation.isPending}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Change Status
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() =>
                    updateStatusMutation.mutate({
                      feedbackId: feedback.id,
                      status: 'open',
                    })
                  }
                >
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    updateStatusMutation.mutate({
                      feedbackId: feedback.id,
                      status: 'in_progress',
                    })
                  }
                >
                  In Progress
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    updateStatusMutation.mutate({
                      feedbackId: feedback.id,
                      status: 'completed',
                    })
                  }
                >
                  Completed
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    updateStatusMutation.mutate({
                      feedbackId: feedback.id,
                      status: 'declined',
                    })
                  }
                >
                  Declined
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setFeedbackToDelete(feedback.id);
                    setDeleteDialogOpen(true);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      size: 80,
    },
  ];

  // Create table instance
  const table = useReactTable({
    data: filteredFeedback,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Reset to page 1 when filter changes
  useEffect(() => {
    table.setPageIndex(0);
  }, [table]);

  // Approve feedback mutation
  const approveFeedbackMutation = useMutation({
    mutationFn: async (feedbackId: string) => {
      if (!user) throw new Error('Not authenticated');

      const result = await approveFeedback(user.id, feedbackId, slug);

      if (!result.success) {
        throw new Error(result.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-admin', slug] });
      queryClient.invalidateQueries({ queryKey: ['feedback', slug] });
      toast({
        title: 'Success',
        description: 'Feedback approved successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve feedback',
        variant: 'destructive',
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ feedbackId, status }: { feedbackId: string; status: string }) => {
      if (!user) throw new Error('Not authenticated');

      const result = await updateFeedbackStatus(user.id, feedbackId, status, slug);

      if (!result.success) {
        throw new Error(result.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-admin', slug] });
      queryClient.invalidateQueries({ queryKey: ['feedback', slug] });
      toast({
        title: 'Success',
        description: 'Status updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update status',
        variant: 'destructive',
      });
    },
  });

  // Delete feedback mutation
  const deleteFeedbackMutation = useMutation({
    mutationFn: async (feedbackId: string) => {
      if (!user) throw new Error('Not authenticated');

      const result = await deleteFeedback(user.id, feedbackId, slug);

      if (!result.success) {
        throw new Error(result.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-admin', slug] });
      queryClient.invalidateQueries({ queryKey: ['feedback', slug] });
      toast({
        title: 'Success',
        description: 'Feedback deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete feedback',
        variant: 'destructive',
      });
    },
  });

  if (authLoading || boardLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!board || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
              <p className="text-muted-foreground">Manage feedback for your board</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/${slug}`}>View Public Board</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/${slug}/settings`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or email..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchText && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchText('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Approval Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-between min-w-[150px]">
                  Approval
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[180px]">
                <DropdownMenuLabel>Filter by approval</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    const isChecked = selectedApprovalStatuses.includes('approved');
                    if (isChecked) {
                      setSelectedApprovalStatuses((prev) => prev.filter((s) => s !== 'approved'));
                    } else {
                      setSelectedApprovalStatuses((prev) => [...prev, 'approved']);
                    }
                  }}
                  className="flex items-center space-x-2"
                >
                  <Checkbox checked={selectedApprovalStatuses.includes('approved')} />
                  <span>Approved</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    const isChecked = selectedApprovalStatuses.includes('pending');
                    if (isChecked) {
                      setSelectedApprovalStatuses((prev) => prev.filter((s) => s !== 'pending'));
                    } else {
                      setSelectedApprovalStatuses((prev) => [...prev, 'pending']);
                    }
                  }}
                  className="flex items-center space-x-2"
                >
                  <Checkbox checked={selectedApprovalStatuses.includes('pending')} />
                  <span>Pending</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Feedback Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-between min-w-[180px]">
                  Status
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[200px]">
                <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    const isChecked = selectedStatuses.includes('open');
                    if (isChecked) {
                      setSelectedStatuses((prev) => prev.filter((s) => s !== 'open'));
                    } else {
                      setSelectedStatuses((prev) => [...prev, 'open']);
                    }
                  }}
                  className="flex items-center space-x-2"
                >
                  <Checkbox checked={selectedStatuses.includes('open')} />
                  <span>Open</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    const isChecked = selectedStatuses.includes('in_progress');
                    if (isChecked) {
                      setSelectedStatuses((prev) => prev.filter((s) => s !== 'in_progress'));
                    } else {
                      setSelectedStatuses((prev) => [...prev, 'in_progress']);
                    }
                  }}
                  className="flex items-center space-x-2"
                >
                  <Checkbox checked={selectedStatuses.includes('in_progress')} />
                  <span>In Progress</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    const isChecked = selectedStatuses.includes('completed');
                    if (isChecked) {
                      setSelectedStatuses((prev) => prev.filter((s) => s !== 'completed'));
                    } else {
                      setSelectedStatuses((prev) => [...prev, 'completed']);
                    }
                  }}
                  className="flex items-center space-x-2"
                >
                  <Checkbox checked={selectedStatuses.includes('completed')} />
                  <span>Completed</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    const isChecked = selectedStatuses.includes('declined');
                    if (isChecked) {
                      setSelectedStatuses((prev) => prev.filter((s) => s !== 'declined'));
                    } else {
                      setSelectedStatuses((prev) => [...prev, 'declined']);
                    }
                  }}
                  className="flex items-center space-x-2"
                >
                  <Checkbox checked={selectedStatuses.includes('declined')} />
                  <span>Declined</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Active Filters Display */}
          <div className="flex flex-wrap gap-2">
            {searchText && (
              <Badge variant="secondary" className="gap-1">
                Search: {searchText}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchText('')} />
              </Badge>
            )}
            {selectedApprovalStatuses.length < 2 &&
              selectedApprovalStatuses.map((status) => (
                <Badge key={status} variant="secondary" className="gap-1">
                  {status === 'approved' ? 'Approved' : 'Pending'}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() =>
                      setSelectedApprovalStatuses((prev) => prev.filter((s) => s !== status))
                    }
                  />
                </Badge>
              ))}
            {selectedStatuses.length < 4 &&
              selectedStatuses.map((status) => (
                <Badge key={status} variant="secondary" className="gap-1">
                  {status === 'in_progress' ? 'In Progress' : status}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setSelectedStatuses((prev) => prev.filter((s) => s !== status))}
                  />
                </Badge>
              ))}
          </div>
        </div>

        {/* Feedback Table */}
        {feedbackLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading feedback...</p>
          </div>
        ) : table.getRowModel().rows?.length ? (
          <>
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const meta = header.column.columnDef.meta as
                          | { headerClassName?: string; cellClassName?: string }
                          | undefined;
                        return (
                          <TableHead
                            key={header.id}
                            style={{ width: header.column.columnDef.size }}
                            className={meta?.headerClassName}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                      {row.getVisibleCells().map((cell) => {
                        const meta = cell.column.columnDef.meta as
                          | { headerClassName?: string; cellClassName?: string }
                          | undefined;
                        return (
                          <TableCell key={cell.id} className={meta?.cellClassName}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-2 py-4">
              <div className="flex-1 text-sm text-muted-foreground">
                Showing{' '}
                <span className="font-medium">
                  {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) *
                      table.getState().pagination.pageSize,
                    table.getFilteredRowModel().rows.length
                  )}
                </span>{' '}
                of <span className="font-medium">{table.getFilteredRowModel().rows.length}</span>{' '}
                results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-semibold mb-2">No feedback found</h3>
            <p className="text-muted-foreground">
              {feedbackList && feedbackList.length > 0
                ? 'Try adjusting your filters to see more results'
                : 'No feedback has been submitted yet'}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Feedback</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this feedback? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setFeedbackToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (feedbackToDelete) {
                  deleteFeedbackMutation.mutate(feedbackToDelete);
                  setDeleteDialogOpen(false);
                  setFeedbackToDelete(null);
                }
              }}
              disabled={deleteFeedbackMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comments Management Dialog */}
      <CommentsDialog
        open={commentsDialogOpen}
        onOpenChange={setCommentsDialogOpen}
        feedback={selectedFeedback}
        boardSlug={slug}
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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedback: Feedback | null;
  boardSlug: string;
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
              <DialogDescription className="text-sm">
                Manage comments for this feedback. You can mark comments as official or delete
                inappropriate ones.
              </DialogDescription>
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
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                    Approval Status
                  </h3>
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      feedback.is_approved
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {feedback.is_approved ? 'Approved' : 'Pending'}
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
            {/* Header - Fixed at top */}
            <div className="p-6 border-b bg-background">
              <h3 className="text-lg font-semibold">Comments ({comments?.length || 0})</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Manage and moderate discussion on this feedback
              </p>
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
                      <CommentItem comment={comment} boardSlug={boardSlug} isBoardOwner={true} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground">No comments yet on this feedback.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
