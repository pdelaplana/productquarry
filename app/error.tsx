'use client';

import { AlertCircle } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Something went wrong!</CardTitle>
          </div>
          <CardDescription>
            We encountered an unexpected error. Please try again or contact support if the problem
            persists.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-md bg-muted p-4">
              <p className="text-sm font-mono text-muted-foreground break-words">{error.message}</p>
              {error.digest && (
                <p className="text-xs text-muted-foreground mt-2">Error ID: {error.digest}</p>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={reset} variant="outline">
            Try Again
          </Button>
          <Button
            onClick={() => {
              window.location.href = '/';
            }}
          >
            Go Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
