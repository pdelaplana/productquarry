'use client';

import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getUserFriendlyMessage, logError } from '@/lib/error-handler';

/**
 * Custom hook for consistent error handling across the application
 */
export function useErrorHandler() {
  const { toast } = useToast();

  const handleError = useCallback(
    (error: unknown, customMessage?: string) => {
      // Log the error
      logError(error);

      // Get user-friendly message
      const message = customMessage || getUserFriendlyMessage(error);

      // Show toast notification
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    },
    [toast]
  );

  const handleSuccess = useCallback(
    (message: string, description?: string) => {
      toast({
        title: message,
        description,
      });
    },
    [toast]
  );

  return {
    handleError,
    handleSuccess,
  };
}

/**
 * Hook for handling mutation errors with React Query
 */
export function useMutationErrorHandler() {
  const { handleError, handleSuccess } = useErrorHandler();

  return {
    onError: handleError,
    onSuccess: (message: string, description?: string) => {
      handleSuccess(message, description);
    },
  };
}
