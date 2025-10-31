# Supabase OTP Authentication Setup

This guide explains how to configure Supabase to send only OTP codes (6-digit passcodes) instead of magic links for public board users.

## Quick Reference - Exact Dashboard Locations

1. **Turn OFF email confirmations:**
   - `Authentication → Configuration → Email Auth`
   - Set "Confirm email" to **OFF**

2. **Update email templates to show OTP code:**
   - `Authentication → Configuration → Email Templates`
   - Edit "Magic Link" template → Use `{{ .Token }}`
   - Edit "Confirm Signup" template → Use `{{ .Token }}`

3. **Optional - Configure SMTP (Production):**
   - `Project Settings → Configuration → Auth`
   - Scroll to "SMTP Settings"

## Problem

When using OTP authentication, Supabase may send:
1. An email verification link (for new users)
2. A magic link email

Instead, we want to send only one email with a 6-digit OTP code.

## Solution

### 1. Supabase Dashboard Configuration

Go to your Supabase project dashboard: `https://supabase.com/dashboard/project/[your-project-ref]`

#### Step 1: Configure Authentication Settings

Navigate to: **Authentication → Configuration → Email Auth**

Settings to configure:
- **Enable Email Provider**: ✅ ON
- **Confirm email**: ❌ OFF (important - prevents verification email)
- **Secure email change**: Configure as needed

#### Step 2: Update Email Templates

Navigate to: **Authentication → Configuration → Email Templates**

You'll see several template options. Update these two:

**A. Magic Link Template** (this is what's used for OTP signin):
   - Click on "Magic Link" from the template list
   - Update the HTML content to display the OTP token:
   ```html
   <h2>Sign in to ProductQuarry</h2>
   <p>Your one-time code is:</p>
   <h1>{{ .Token }}</h1>
   <p>This code expires in 1 hour.</p>
   <p>If you didn't request this code, you can safely ignore this email.</p>
   ```

**B. Confirm Signup Template** (for new user signups):
   - Click on "Confirm Signup" from the template list
   - Update to show the OTP token instead of confirmation link:
   ```html
   <h2>Welcome to ProductQuarry</h2>
   <p>Your verification code is:</p>
   <h1>{{ .Token }}</h1>
   <p>This code expires in 1 hour.</p>
   ```

**Important Notes:**
- The `{{ .Token }}` variable contains the 6-digit OTP code
- Both templates must use `{{ .Token }}` instead of `{{ .ConfirmationURL }}`
- Styling can be customized but keep `{{ .Token }}` visible

### 3. Email Provider (Recommended for Production)

For production, configure a custom SMTP provider for better deliverability.

Navigate to: **Project Settings → Configuration → Auth**

Scroll to **SMTP Settings** and configure:

```
Host: smtp.sendgrid.net (or your provider)
Port: 587
User: apikey (or your SMTP username)
Password: [Your SMTP Password/API Key]
Sender Email: noreply@yourdomain.com
Sender Name: ProductQuarry
```

Supported providers: SendGrid, Postmark, Mailgun, Amazon SES, etc.

**Note:** Without custom SMTP, Supabase uses their built-in email service which has rate limits.

### 4. Local Development Configuration

The `supabase/config.toml` file is already configured for OTP. Verify these settings:

```toml
[auth.email]
enable_signup = true
enable_confirmations = false  # CRITICAL: prevents verification emails
otp_length = 6               # 6-digit OTP codes
otp_expiry = 3600           # 1 hour expiration
```

**Key Configuration:**
- `enable_confirmations = false` prevents the two-email problem
- With this setting, users don't need to confirm email before using OTP
- OTP codes are 6 digits and expire after 1 hour

### 5. Testing

To test locally:
1. Start Supabase: `npx supabase start`
2. Access Inbucket (email testing) at: `http://127.0.0.1:54324`
3. Test the sign-in flow
4. Check Inbucket to verify only one email with a 6-digit code is sent

## How It Works

1. User enters email address
2. Supabase sends ONE email with a 6-digit OTP code
3. User enters the OTP code
4. Backend validates the OTP
5. If new user: account is created and user is logged in
6. If existing user: user is logged in

## Code Implementation

The OTP flow is implemented in:
- `/lib/auth.ts` - Auth helper functions
- `/components/email-auth-dialog.tsx` - OTP dialog component

The flow uses:
- `supabase.auth.signInWithOtp()` - Send OTP code
- `supabase.auth.verifyOtp()` - Verify OTP code

Both new and existing users are handled automatically by Supabase.
