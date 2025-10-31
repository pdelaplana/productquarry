'use client';

import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings as SettingsIcon,
  User,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { EmailAuthDialog } from '@/components/email-auth-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { authHelpers } from '@/lib/auth';
import { useAuth } from '@/lib/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import type { Board } from '@/types/database';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  // Check if user is a customer (board owner)
  const { data: isCustomer } = useQuery({
    queryKey: ['customer-check', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking customer status:', error);
      }
      return data !== null;
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    try {
      await authHelpers.signOut();
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
      });

      // Different redirect behavior based on user type
      if (isCustomer) {
        // Board owners (customers) are redirected to login page
        router.push('/auth/login');
      } else if (boardSlug) {
        // Public board users stay on the current board page
        router.push(`/${boardSlug}`);
      } else {
        // Fallback: redirect to home if no board context
        router.push('/');
      }
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Detect if we're on a board route and extract slug
  const boardSlug = useMemo(() => {
    if (!pathname) return null;

    // Split pathname and get first segment
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return null;

    // Check if first segment is a known non-board route
    const knownRoutes = ['dashboard', 'auth', 'account', 'api', 'sentry-example-page'];
    if (knownRoutes.includes(segments[0])) return null;

    // If we have segments, first one is likely the board slug
    return segments[0];
  }, [pathname]);

  // Fetch board data if on a board route
  const { data: board } = useQuery({
    queryKey: ['board', boardSlug],
    queryFn: async () => {
      if (!boardSlug) return null;

      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('slug', boardSlug)
        .single();

      if (error) return null;
      return data as Board;
    },
    enabled: !!boardSlug,
  });

  // Don't show navbar on auth pages
  if (pathname?.startsWith('/auth')) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Image src="/icon.png" alt="ProductQuarry" width={32} height={32} className="rounded" />
            {board && (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-foreground">{board.name}</span>
              </>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <User className="h-4 w-4" />
                    <span>{user.email?.split('@')[0] || 'Account'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">My Account</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isCustomer && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="cursor-pointer">
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => setAuthDialogOpen(true)}
                variant="outline"
                className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold"
              >
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-accent"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t"
          >
            <div className="container mx-auto px-4 py-4 space-y-3">
              {user ? (
                <>
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">My Account</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>

                  {isCustomer && (
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 transition-colors"
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      <span className="font-medium">Dashboard</span>
                    </Link>
                  )}

                  <Link
                    href="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 transition-colors"
                  >
                    <SettingsIcon className="h-5 w-5" />
                    <span className="font-medium">Account Settings</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 transition-colors text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </>
              ) : (
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAuthDialogOpen(true);
                  }}
                  variant="outline"
                  className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold"
                >
                  Sign In
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Dialog */}
      <EmailAuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onSuccess={() => {
          toast({
            title: 'Welcome!',
            description: 'You are now signed in',
          });
        }}
      />
    </nav>
  );
}
