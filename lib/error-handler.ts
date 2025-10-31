/**
 * Error handling utilities for consistent error messages and handling
 */

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: unknown;
}

/**
 * Parse and format errors from various sources into a consistent format
 */
export function parseError(error: unknown): AppError {
  // If it's already an AppError
  if (isAppError(error)) {
    return error;
  }

  // If it's an Error object
  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'ERROR',
    };
  }

  // If it's a Supabase error
  if (isSupabaseError(error)) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.status,
      details: error.details,
    };
  }

  // If it's an API error response
  if (isApiError(error)) {
    return {
      message: error.error || 'An error occurred',
      ...(error.code !== undefined && { code: error.code }),
      ...(error.statusCode !== undefined && { statusCode: error.statusCode }),
    };
  }

  // Default fallback
  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Get a user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  const parsed = parseError(error);

  // Map specific error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    // Auth errors
    PGRST301: 'Invalid credentials. Please check your email and password.',
    '23505': 'This account already exists.',
    invalid_credentials: 'Invalid email or password.',
    email_not_confirmed: 'Please verify your email before logging in.',

    // Database errors
    '23503': "Cannot delete this item because it's being used elsewhere.",
    '42P01': 'Database table not found. Please contact support.',

    // Network errors
    NETWORK_ERROR: 'Network error. Please check your internet connection.',
    TIMEOUT: 'Request timed out. Please try again.',

    // Permission errors
    FORBIDDEN: "You don't have permission to perform this action.",
    UNAUTHORIZED: "You don't have permission to access this resource.",

    // Not found
    PGRST116: 'The requested resource was not found.',
    NOT_FOUND: 'The requested resource was not found.',

    // General
    UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  };

  return errorMessages[parsed.code || ''] || parsed.message;
}

/**
 * Type guards
 */
function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as AppError).message === 'string'
  );
}

function isSupabaseError(error: unknown): error is {
  message: string;
  code: string;
  status: number;
  details: unknown;
} {
  return typeof error === 'object' && error !== null && 'message' in error && 'code' in error;
}

function isApiError(error: unknown): error is {
  error: string;
  code?: string;
  statusCode?: number;
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as { error: string }).error === 'string'
  );
}

/**
 * Log errors (in production, this could send to an error tracking service)
 */
export function logError(error: unknown, context?: Record<string, unknown>) {
  const parsed = parseError(error);

  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', parsed, context);
  } else {
    // In production, send to error tracking service
    // Example: Sentry.captureException(error, { extra: context });
    console.error('Error:', parsed.message);
  }
}

/**
 * Handle async errors with consistent error handling
 */
export async function handleAsync<T>(
  promise: Promise<T>,
  errorMessage?: string
): Promise<[null, T] | [AppError, null]> {
  try {
    const data = await promise;
    return [null, data];
  } catch (error) {
    const parsed = parseError(error);
    if (errorMessage) {
      parsed.message = errorMessage;
    }
    logError(parsed);
    return [parsed, null];
  }
}
