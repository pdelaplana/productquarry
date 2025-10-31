'use client';

import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FadeIn } from './animated-container';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
}

/**
 * Generic error state component for displaying errors
 */
export function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an error. Please try again.',
  onRetry,
  showHomeButton = false,
}: ErrorStateProps) {
  return (
    <FadeIn className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="w-full max-w-md border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">{title}</CardTitle>
          </div>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          {onRetry && (
            <Button onClick={onRetry} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}
          {showHomeButton && (
            <Button
              onClick={() => {
                window.location.href = '/';
              }}
              variant="default"
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          )}
        </CardContent>
      </Card>
    </FadeIn>
  );
}

/**
 * Error state for failed data fetching
 */
export function FetchErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Failed to load data"
      message="We couldn't load the data you requested. Please check your connection and try again."
      {...(onRetry && { onRetry })}
    />
  );
}

/**
 * Error state for not found resources
 */
export function NotFoundState({ resourceName = 'Page' }: { resourceName?: string }) {
  return (
    <ErrorState
      title={`${resourceName} Not Found`}
      message={`The ${resourceName.toLowerCase()} you're looking for doesn't exist or has been removed.`}
      showHomeButton
    />
  );
}

/**
 * Error state for unauthorized access
 */
export function UnauthorizedState() {
  return (
    <ErrorState
      title="Access Denied"
      message="You don't have permission to access this resource. Please log in or contact support."
      showHomeButton
    />
  );
}

/**
 * Inline error message for forms and smaller components
 */
export function InlineError({ message }: { message: string }) {
  return (
    <FadeIn className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <p>{message}</p>
    </FadeIn>
  );
}
