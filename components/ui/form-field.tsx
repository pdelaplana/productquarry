'use client';

import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label?: string;
  error?: string;
  success?: boolean;
  required?: boolean;
  helpText?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Enhanced form field wrapper with validation feedback
 */
export function FormField({
  label,
  error,
  success,
  required,
  helpText,
  children,
  className,
}: FormFieldProps) {
  const hasError = !!error;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className="flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}

      <div className="relative">
        {children}

        {/* Success indicator */}
        {success && !hasError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
        )}
      </div>

      {/* Help text */}
      {helpText && !hasError && <p className="text-xs text-muted-foreground">{helpText}</p>}

      {/* Error message */}
      {hasError && (
        <div className="flex items-start gap-2 text-sm text-destructive animate-in slide-in-from-top-1">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

interface FormErrorSummaryProps {
  errors: Record<string, string | undefined>;
  title?: string;
}

/**
 * Form-level error summary to show all errors at once
 */
export function FormErrorSummary({
  errors,
  title = 'Please fix the following errors:',
}: FormErrorSummaryProps) {
  const errorEntries = Object.entries(errors).filter(([_, error]) => error);

  if (errorEntries.length === 0) return null;

  return (
    <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 animate-in slide-in-from-top-2">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-destructive mb-2">{title}</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
            {errorEntries.map(([field, error]) => (
              <li key={field}>{error}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

interface FormSuccessMessageProps {
  message: string;
  description?: string;
}

/**
 * Success message component for forms
 */
export function FormSuccessMessage({ message, description }: FormSuccessMessageProps) {
  return (
    <div className="rounded-md border border-green-500/50 bg-green-50 dark:bg-green-950 p-4 animate-in slide-in-from-top-2">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-green-900 dark:text-green-100">{message}</p>
          {description && (
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
