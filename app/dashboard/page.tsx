'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, MoreVertical, Plus, Settings, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { type CreateBoardData, createBoardSchema } from '@/lib/validations';
import { createBoard, deleteBoard } from '@/server/actions/board-actions';
import type { Board } from '@/types/database';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCustomer, setIsCustomer] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateBoardData>({
    resolver: zodResolver(createBoardSchema),
    defaultValues: {
      is_public: false,
      requires_approval: true,
    },
  });

  // Check if user is authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Check if user is a customer (board owner)
  const { data: customerCheck, isLoading: customerCheckLoading } = useQuery({
    queryKey: ['customer-check', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking customer status:', error);
      }
      return data;
    },
    enabled: !!user,
  });

  // Update isCustomer state and redirect non-customers
  useEffect(() => {
    if (customerCheck !== undefined) {
      setIsCustomer(customerCheck !== null);

      // Redirect voting users (non-customers) to account page
      if (customerCheck === null && user) {
        toast({
          title: 'Access Denied',
          description: 'Only board owners can access the dashboard.',
          variant: 'destructive',
        });
        router.push('/account');
      }
    }
  }, [customerCheck, user, router, toast]);

  // Fetch boards (only for customers)
  const { data: boards, isLoading: boardsLoading } = useQuery({
    queryKey: ['boards', user?.id],
    queryFn: async () => {
      if (!user || !customerCheck) return [];
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Board[];
    },
    enabled: !!user && !!customerCheck,
  });

  // Create board mutation
  const createBoardMutation = useMutation({
    mutationFn: async (data: CreateBoardData) => {
      if (!user) throw new Error('Not authenticated');

      const result = await createBoard(user.id, data);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', user?.id] });
      toast({
        title: 'Success',
        description: 'Board created successfully',
      });
      setIsDialogOpen(false);
      reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create board',
        variant: 'destructive',
      });
    },
  });

  // Delete board mutation
  const deleteBoardMutation = useMutation({
    mutationFn: async (boardId: string) => {
      if (!user) throw new Error('Not authenticated');

      const result = await deleteBoard(user.id, boardId);

      if (!result.success) {
        throw new Error(result.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', user?.id] });
      toast({
        title: 'Success',
        description: 'Board deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete board',
        variant: 'destructive',
      });
    },
  });

  const handleDeleteBoard = (boardId: string, boardName: string) => {
    if (
      confirm(
        `Are you sure you want to delete "${boardName}"? This action cannot be undone and will delete all associated feedback.`
      )
    ) {
      deleteBoardMutation.mutate(boardId);
    }
  };

  const onSubmit = (data: CreateBoardData) => {
    createBoardMutation.mutate(data);
  };

  // Show loading state
  if (authLoading || customerCheckLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // If user is not authenticated or not a customer, return null (will be redirected by useEffect)
  if (!user || isCustomer === false) {
    return null;
  }

  // Customer user view
  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My Boards</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Manage all your feedback boards
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create Board
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Board</DialogTitle>
              <DialogDescription>Create a new feedback board for your product</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Board Name</Label>
                  <Input
                    id="name"
                    placeholder="My Product"
                    {...register('name')}
                    disabled={createBoardMutation.isPending}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Board Slug</Label>
                  <Input
                    id="slug"
                    placeholder="my-product"
                    {...register('slug')}
                    disabled={createBoardMutation.isPending}
                  />
                  <p className="text-sm text-muted-foreground">
                    This will be part of your board URL
                  </p>
                  {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="Feedback for our awesome product"
                    {...register('description')}
                    disabled={createBoardMutation.isPending}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description.message}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createBoardMutation.isPending}>
                  {createBoardMutation.isPending ? 'Creating...' : 'Create Board'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {boardsLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading boards...</p>
        </div>
      ) : boards && boards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <Card key={board.id} className="hover:shadow-lg transition-shadow relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div
                    className="flex-1 cursor-pointer hover:opacity-80 transition-opacity rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onClick={() => router.push(`/${board.slug}/dashboard`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(`/${board.slug}/dashboard`);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`View dashboard for ${board.name}`}
                  >
                    <CardTitle>{board.name}</CardTitle>
                    <CardDescription>{board.description || 'No description'}</CardDescription>
                    <div className="mt-2">
                      <span className="text-xs text-muted-foreground">/{board.slug}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/${board.slug}/dashboard`);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/${board.slug}/settings`);
                        }}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBoard(board.id, board.name);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Board
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-lg font-semibold mb-2">No boards yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first feedback board to get started
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Board
          </Button>
        </div>
      )}
    </div>
  );
}
