'use client';

import { useQuery } from '@tanstack/react-query';
import { Calendar, Mail, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';

export default function AccountPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account information and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your account details and personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
              <User className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">User ID</p>
                <p className="text-sm text-muted-foreground font-mono">{user.id}</p>
              </div>
            </div>

            {user.created_at && (
              <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        {isCustomer && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Access your dashboard and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/dashboard')}
              >
                <User className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Coming Soon */}
        <Card>
          <CardHeader>
            <CardTitle>More Settings Coming Soon</CardTitle>
            <CardDescription>We're working on adding more features</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-2">
              <li>Update email and password</li>
              <li>Notification preferences</li>
              <li>Billing and subscription management</li>
              <li>API access and integrations</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
