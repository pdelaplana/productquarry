/**
 * Utility for wrapping server actions with Sentry monitoring
 */
import * as Sentry from '@sentry/nextjs';

/**
 * Wraps a server action function with Sentry monitoring
 * @param actionName Name of the server action
 * @param fn The server action function to wrap
 * @returns The wrapped server action function
 */
export function withSentryServerAction<
  // biome-ignore lint/suspicious/noExplicitAny: We need any type here to support various server action return types
  T extends (...args: any[]) => Promise<any>,
>(actionName: string, fn: T): T {
  return (async (...args: Parameters<T>) => {
    // Set action information in Sentry
    Sentry.setTag('server.action', actionName);

    // Add breadcrumb for action invocation
    Sentry.addBreadcrumb({
      category: 'server.action',
      message: `Executing server action: ${actionName}`,
      level: 'info',
      data: {
        argCount: args.length,
        // Safely mask potentially sensitive data
        hasData: args.length > 0,
      },
    });

    // Use startSpan for performance monitoring and execute the function within its context
    return Sentry.startSpan(
      { name: `server.action.${actionName}`, op: 'server.action' },
      async () => {
        try {
          // Measure execution time manually
          const startTime = performance.now();

          // Execute the original function
          const result = await fn(...args);

          // Record execution time
          const duration = performance.now() - startTime;

          // Add performance breadcrumb
          Sentry.addBreadcrumb({
            category: 'performance',
            message: `Server action completed: ${actionName}`,
            level: 'info',
            data: {
              duration: `${duration.toFixed(2)}ms`,
              success: true,
            },
          });

          return result;
        } catch (error) {
          // Capture any errors with context
          Sentry.captureException(error, {
            tags: {
              action: actionName,
            },
            contexts: {
              source: {
                type: 'server-action',
                name: actionName,
              },
            },
          });

          // Re-throw the error so it can be handled by the caller
          throw error;
        }
      }
    );
  }) as T;
}
