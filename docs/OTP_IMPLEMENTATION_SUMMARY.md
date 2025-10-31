# OTP Authentication Implementation Summary

## Overview

The OTP (One-Time Password) authentication flow has been streamlined to provide a simpler user experience for public board users (voting, commenting, etc.).

## What Changed

### 1. Authentication Flow
**Before:**
- User enters email
- Receives two emails: verification email + magic link
- Confusing experience with modal asking for 6-digit code

**After:**
- User enters email address
- Receives ONE email with a 6-digit OTP code
- User enters the OTP code
- System automatically creates account (if new user) or logs in (if existing user)

### 2. Code Changes

#### `lib/auth.ts`
Added new OTP-specific helper functions:
- `sendOTP(data: OTPData)` - Sends 6-digit OTP code to email
- `verifyOTP(data: VerifyOTPData)` - Verifies OTP and logs user in
- Both functions handle new and existing users automatically

#### `lib/validations.ts`
Added new validation schemas:
- `sendOTPSchema` - Validates email format
- `verifyOTPSchema` - Validates 6-digit numeric OTP code
- Proper TypeScript types exported

#### `components/email-auth-dialog.tsx`
Enhanced the authentication dialog:
- Now uses React Hook Form with Zod validation
- Separate forms for email and OTP steps
- Better error handling and user feedback
- Improved UX with proper input modes for numeric OTP
- Renamed from `vote-auth-dialog` to `email-auth-dialog` for better clarity

### 3. Configuration

#### Supabase Configuration Required
To ensure only OTP codes are sent (not magic links), update your Supabase project:

1. **Email Templates** (in Supabase Dashboard):
   - Update "Confirm Signup" template to show `{{ .Token }}`
   - Update "Magic Link" template to show `{{ .Token }}`

2. **Authentication Settings**:
   - Disable email confirmations
   - Enable email OTP
   - Set OTP expiration: 3600 seconds (1 hour)
   - Set OTP length: 6 characters

See `docs/SUPABASE_OTP_SETUP.md` for detailed setup instructions.

## User Flow

### For New Users:
1. Click "Sign in to vote" (or similar action)
2. Enter email address
3. Receive email with 6-digit code
4. Enter code in modal
5. **Account is automatically created and user is logged in**

### For Existing Users:
1. Click "Sign in to vote"
2. Enter email address
3. Receive email with 6-digit code
4. Enter code in modal
5. **User is logged in**

## Files Modified

- `/lib/auth.ts` - Added OTP helper functions
- `/lib/validations.ts` - Added OTP validation schemas
- `/components/email-auth-dialog.tsx` - Enhanced with React Hook Form and better UX

## Files Created

- `/docs/SUPABASE_OTP_SETUP.md` - Detailed Supabase configuration guide
- `/docs/OTP_IMPLEMENTATION_SUMMARY.md` - This file

## Testing

### Local Testing:
1. Start Supabase: `npx supabase start`
2. Start dev server: `npm run dev`
3. Access Inbucket (email viewer): `http://127.0.0.1:54324`
4. Test the sign-in flow on a public board
5. Check Inbucket to verify only one email with 6-digit code is sent

### Production Testing:
1. Ensure Supabase project is configured per `SUPABASE_OTP_SETUP.md`
2. Test with real email addresses
3. Verify only one email is received with 6-digit code
4. Test both new user signup and existing user login

## Key Benefits

1. **Simpler UX**: One email, one step
2. **No confusion**: Clear 6-digit code instead of magic links
3. **Automatic account creation**: New users don't need separate signup
4. **Proper validation**: Zod schemas ensure correct data format
5. **Better error handling**: Clear error messages for users

## Next Steps (If Needed)

- Add rate limiting for OTP requests
- Implement resend OTP functionality
- Add OTP expiration countdown timer
- Consider SMS OTP as alternative to email
