'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authHelpers } from '@/lib/auth';
import {
  sendOTPSchema,
  verifyOTPSchema,
  type SendOTPData,
  type VerifyOTPData,
} from '@/lib/validations';

interface EmailAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EmailAuthDialog({ open, onOpenChange, onSuccess }: EmailAuthDialogProps) {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const { toast } = useToast();

  // Form for sending OTP
  const emailForm = useForm<SendOTPData>({
    resolver: zodResolver(sendOTPSchema),
    defaultValues: {
      email: '',
    },
  });

  // Form for verifying OTP
  const otpForm = useForm<VerifyOTPData>({
    resolver: zodResolver(verifyOTPSchema),
    defaultValues: {
      email: '',
      token: '',
    },
  });

  const handleSendOTP = async (data: SendOTPData) => {
    setLoading(true);

    try {
      await authHelpers.sendOTP(data);

      toast({
        title: 'Verification code sent',
        description: 'Check your email for a 6-digit code',
      });

      // Store email and prepare OTP form
      setSentEmail(data.email);
      otpForm.setValue('email', data.email);
      setStep('otp');
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send verification code',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (data: VerifyOTPData) => {
    setLoading(true);

    try {
      await authHelpers.verifyOTP(data);

      toast({
        title: 'Success',
        description: 'You are now signed in',
      });

      // Reset forms and close dialog
      handleDialogClose(false);

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast({
        title: 'Invalid code',
        description:
          error instanceof Error ? error.message : 'Please check your code and try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('email');
    otpForm.reset();
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // Reset all forms and state when dialog closes
      emailForm.reset();
      otpForm.reset();
      setStep('email');
      setSentEmail('');
      setLoading(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign in</DialogTitle>
          <DialogDescription>
            {step === 'email'
              ? 'Enter your email to receive a verification code'
              : 'Enter the verification code sent to your email'}
          </DialogDescription>
        </DialogHeader>

        {step === 'email' ? (
          <form onSubmit={emailForm.handleSubmit(handleSendOTP)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...emailForm.register('email')}
                disabled={loading}
                autoFocus
              />
              {emailForm.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending code...' : 'Send verification code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={otpForm.handleSubmit(handleVerifyOTP)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="000000"
                {...otpForm.register('token')}
                disabled={loading}
                autoFocus
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
              />
              {otpForm.formState.errors.token && (
                <p className="text-xs text-destructive">{otpForm.formState.errors.token.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Code sent to <strong>{sentEmail}</strong>
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={loading}
                className="flex-1"
              >
                Back
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
