'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Copy, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { verifyBoardOwnershipBySlug } from '@/lib/customer-verification';
import { useAuth } from '@/lib/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { type UpdateBoardData, updateBoardSchema } from '@/lib/validations';
import { deleteBoard, updateBoard } from '@/server/actions/board-actions';
import type { Board } from '@/types/database';

export default function BoardSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPublic, setIsPublic] = useState(true);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [copied, setCopied] = useState(false);

  // Widget code generator state
  const [widgetPosition, setWidgetPosition] = useState('bottom-right');
  const [widgetTheme, setWidgetTheme] = useState('light');
  const [widgetButtonText, setWidgetButtonText] = useState('Feedback');
  const [widgetPrimaryColor, setWidgetPrimaryColor] = useState('#2563eb');
  const [widgetAutoOpen, setWidgetAutoOpen] = useState(false);

  // Fetch board and check ownership
  const { data: board, isLoading: boardLoading } = useQuery({
    queryKey: ['board', slug],
    queryFn: async () => {
      const { data, error } = await supabase.from('boards').select('*').eq('slug', slug).single();

      if (error) throw error;
      return data as Board;
    },
    enabled: !!user,
  });

  // Initialize form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<UpdateBoardData>({
    resolver: zodResolver(updateBoardSchema),
  });

  // Populate form when board loads
  useEffect(() => {
    if (board) {
      reset({
        name: board.name,
        description: board.description || '',
        slug: board.slug,
      });
      setIsPublic(board.is_public);
      setRequiresApproval(board.requires_approval);
      setValue('is_public', board.is_public);
      setValue('requires_approval', board.requires_approval);
    }
  }, [board, reset, setValue]);

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

  // Update board mutation
  const updateBoardMutation = useMutation({
    mutationFn: async (data: UpdateBoardData) => {
      if (!board || !user) throw new Error('Board or user not found');

      const result = await updateBoard(user.id, board.id, data);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['board', slug] });
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast({
        title: 'Success',
        description: 'Board settings updated successfully',
      });

      // If slug changed, redirect to new slug
      if (data.slug !== slug) {
        router.push(`/${data.slug}/settings`);
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update board',
        variant: 'destructive',
      });
    },
  });

  // Delete board mutation
  const deleteBoardMutation = useMutation({
    mutationFn: async () => {
      if (!board || !user) throw new Error('Board or user not found');

      const result = await deleteBoard(user.id, board.id);

      if (!result.success) {
        throw new Error(result.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast({
        title: 'Success',
        description: 'Board deleted successfully',
      });
      router.push('/dashboard');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete board',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: UpdateBoardData) => {
    updateBoardMutation.mutate(data);
  };

  const handleDelete = () => {
    if (
      confirm(
        'Are you sure you want to delete this board? This action cannot be undone and will delete all associated feedback.'
      )
    ) {
      deleteBoardMutation.mutate();
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Widget code copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const getWidgetCode = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const attributes = [`src="${origin}/widget.js"`, `data-board-slug="${slug}"`];

    // Add optional attributes
    if (widgetPosition !== 'bottom-right') {
      attributes.push(`data-position="${widgetPosition}"`);
    }
    if (widgetTheme !== 'light') {
      attributes.push(`data-theme="${widgetTheme}"`);
    }
    if (widgetButtonText !== 'Feedback') {
      attributes.push(`data-button-text="${widgetButtonText}"`);
    }
    if (widgetPrimaryColor !== '#2563eb') {
      attributes.push(`data-primary-color="${widgetPrimaryColor}"`);
    }
    if (widgetAutoOpen) {
      attributes.push(`data-auto-open="true"`);
    }

    return `<script ${attributes.join(' ')}></script>`;
  };

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
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/${slug}/dashboard`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold mb-1">Board Settings</h1>
              <p className="text-muted-foreground">Manage your board configuration</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update your board's name, description, and URL</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Board Name</Label>
                <Input
                  id="name"
                  placeholder="My Product Feedback"
                  {...register('name')}
                  disabled={updateBoardMutation.isPending}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Share your thoughts and help us improve"
                  rows={3}
                  {...register('description')}
                  disabled={updateBoardMutation.isPending}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Board URL Slug</Label>
                <Input
                  id="slug"
                  placeholder="my-product"
                  {...register('slug')}
                  disabled={updateBoardMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Your board will be accessible at:{' '}
                  {typeof window !== 'undefined' ? window.location.origin : ''}/{'{slug}'}
                </p>
                {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Moderation */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Moderation</CardTitle>
              <CardDescription>
                Control who can see your board and how feedback is moderated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="is_public">Board Visibility</Label>
                <Select
                  value={isPublic ? 'public' : 'private'}
                  onValueChange={(value) => {
                    const publicValue = value === 'public';
                    setIsPublic(publicValue);
                    setValue('is_public', publicValue);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - Anyone can view</SelectItem>
                    <SelectItem value="private">Private - Only you can view</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {isPublic
                    ? 'Your board is visible to anyone with the link'
                    : 'Your board is private and only you can access it'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requires_approval">Feedback Moderation</Label>
                <Select
                  value={requiresApproval ? 'manual' : 'auto'}
                  onValueChange={(value) => {
                    const approvalValue = value === 'manual';
                    setRequiresApproval(approvalValue);
                    setValue('requires_approval', approvalValue);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      Auto-approve - Feedback appears immediately
                    </SelectItem>
                    <SelectItem value="manual">
                      Manual approval - Review before publishing
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {requiresApproval
                    ? "You'll need to approve feedback before it appears on your public board"
                    : 'All feedback will appear on your public board immediately'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button type="submit" className="w-full" disabled={updateBoardMutation.isPending}>
            {updateBoardMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>

        {/* Widget Embed Code */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Widget Embed Code</CardTitle>
            <CardDescription>
              Add this code to your website to display the feedback widget
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Widget Configuration Form */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Customize Your Widget</Label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Position */}
                <div className="space-y-2">
                  <Label htmlFor="widget-position">Position</Label>
                  <Select value={widgetPosition} onValueChange={setWidgetPosition}>
                    <SelectTrigger id="widget-position">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="top-left">Top Left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Theme */}
                <div className="space-y-2">
                  <Label htmlFor="widget-theme">Theme</Label>
                  <Select value={widgetTheme} onValueChange={setWidgetTheme}>
                    <SelectTrigger id="widget-theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Button Text */}
                <div className="space-y-2">
                  <Label htmlFor="widget-button-text">Button Text</Label>
                  <Input
                    id="widget-button-text"
                    value={widgetButtonText}
                    onChange={(e) => setWidgetButtonText(e.target.value)}
                    placeholder="Feedback"
                  />
                </div>

                {/* Primary Color */}
                <div className="space-y-2">
                  <Label htmlFor="widget-primary-color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="widget-primary-color"
                      type="color"
                      value={widgetPrimaryColor}
                      onChange={(e) => setWidgetPrimaryColor(e.target.value)}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={widgetPrimaryColor}
                      onChange={(e) => setWidgetPrimaryColor(e.target.value)}
                      placeholder="#2563eb"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Auto-open option */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="widget-auto-open"
                  checked={widgetAutoOpen}
                  onChange={(e) => setWidgetAutoOpen(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="widget-auto-open" className="text-sm font-normal cursor-pointer">
                  Auto-open widget on page load (once per session)
                </Label>
              </div>
            </div>

            {/* Generated Code */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Generated Embed Code</Label>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto max-h-40">
                  <code>{getWidgetCode()}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(getWidgetCode())}
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Add this code snippet just before the closing <code>&lt;/body&gt;</code> tag on your
                website
              </p>
            </div>

            {/* Documentation and Demo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950 rounded-md">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">Integration Guide</h4>
                  <p className="text-xs text-muted-foreground">Detailed integration instructions</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="/docs/widget-integration" target="_blank" rel="noopener noreferrer">
                    View Docs
                  </a>
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950 rounded-md">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">Widget Demo</h4>
                  <p className="text-xs text-muted-foreground">See the widget in action</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="/widget-demo.html" target="_blank" rel="noopener noreferrer">
                    View Demo
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="mt-8 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions - proceed with caution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Delete Board</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this board and all associated feedback
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteBoardMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deleteBoardMutation.isPending ? 'Deleting...' : 'Delete Board'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
