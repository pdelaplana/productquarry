# Database Migration Guide

This guide explains how to run database migrations for ProductQuarry using the Supabase CLI or manual SQL execution.

## Table of Contents
- [Method 1: Using Supabase CLI (Recommended)](#method-1-using-supabase-cli-recommended)
- [Method 2: Manual SQL Execution](#method-2-manual-sql-execution)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

---

## Method 1: Using Supabase CLI (Recommended)

### Prerequisites
✅ Supabase CLI is already installed in this project as a dev dependency

### Step 1: Get Your Supabase Access Token

1. Go to https://app.supabase.com/account/tokens
2. Click **"Generate new token"**
3. Give it a name (e.g., "ProductQuarry CLI")
4. Click "Generate token"
5. **Copy the token** (you'll need it in the next step)
6. Save it securely - you won't be able to see it again

### Step 2: Login to Supabase CLI

Run this command in your terminal:

```bash
npx supabase login
```

When prompted, paste your access token from Step 1.

**Expected output:**
```
Finished supabase login.
```

### Step 3: Link Your Local Project to Remote

```bash
npx supabase link --project-ref xcxlstqrmsiiqnxkzfcj
```

**You will be prompted for:**
- Database password: Enter the password you set when creating your Supabase project

**Expected output:**
```
Finished supabase link.
```

### Step 4: Push Migrations to Remote Database

```bash
npx supabase db push
```

This command will:
- Read all SQL files from the `supabase/migrations/` folder
- Execute them in alphabetical order on your remote database
- Create tables, indexes, RLS policies, and auth triggers

**Expected output:**
```
Applying migration 001_create_schema.sql...
Applying migration 002_setup_rls.sql...
Applying migration 003_setup_auth.sql...
Finished supabase db push.
```

### Step 5: Verify Migrations

Check if migrations were applied successfully:

```bash
npx supabase db diff
```

If everything is applied, you should see:
```
No schema changes detected.
```

---

## Method 2: Manual SQL Execution

If the CLI doesn't work or you prefer manual execution:

### Step 1: Access Supabase SQL Editor

1. Go to https://app.supabase.com
2. Select your project (xcxlstqrmsiiqnxkzfcj)
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"**

### Step 2: Run Migration 1 - Create Schema

1. Open the file: `supabase/migrations/001_create_schema.sql`
2. Copy the entire contents
3. Paste into the SQL Editor
4. Click **"Run"** button (or press Ctrl/Cmd + Enter)
5. Wait for success message

**Expected:** "Success. No rows returned" (this is normal for DDL statements)

### Step 3: Run Migration 2 - Setup RLS

1. Clear the SQL Editor
2. Open the file: `supabase/migrations/002_setup_rls.sql`
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **"Run"**
6. Wait for success message

**Expected:** Multiple success messages for each policy created

### Step 4: Run Migration 3 - Setup Auth

1. Clear the SQL Editor
2. Open the file: `supabase/migrations/003_setup_auth.sql`
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **"Run"**
6. Wait for success message

**Expected:** Success message confirming function and trigger creation

---

## Verification

### Check Tables Were Created

Run this query in SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected result:** You should see 3 tables:
- `boards`
- `customers`
- `feedback`

### Check RLS is Enabled

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected result:** All three tables should have `rowsecurity = true`

### Check Indexes Were Created

```sql
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY indexname;
```

**Expected result:** You should see:
- `idx_boards_customer_id`
- `idx_boards_slug`
- `idx_feedback_board_id`
- `idx_feedback_is_approved`
- `idx_feedback_status`
- `idx_feedback_type`
- Plus primary key indexes

### Check Auth Trigger Exists

```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

**Expected result:** You should see `on_auth_user_created` trigger on `auth.users` table

### Test Auth Trigger (Optional)

You can test the auth trigger by creating a test user in the Authentication section:
1. Go to Authentication → Users
2. Click "Add user"
3. Enter email and password
4. After creation, check the `customers` table - a new record should be auto-created

---

## Troubleshooting

### "Access token not provided" Error

**Solution:** Make sure you've completed Step 2 (Login to Supabase CLI) successfully.

### "Database password incorrect" Error

**Solution:**
1. Reset your database password in Supabase dashboard
2. Go to Settings → Database → Database Password → Reset Password
3. Try linking again with the new password

### "Migration already applied" Error

**Solution:** This is safe to ignore. It means the migration was already run. Use `npx supabase db diff` to check current state.

### Permissions Error

**Solution:** Make sure you're using the correct project reference and that you have owner/admin access to the Supabase project.

### "Cannot connect to database" Error

**Solution:**
1. Check your internet connection
2. Verify the project is not paused in Supabase dashboard
3. Try again in a few minutes

---

## What These Migrations Do

### Migration 1: Schema Creation (001_create_schema.sql)
- Creates `customers` table for user accounts
- Creates `boards` table for feedback boards
- Creates `feedback` table for customer feedback
- Adds indexes for query performance optimization

### Migration 2: Row Level Security (002_setup_rls.sql)
- Enables RLS on all tables for security
- Sets up policies so:
  - Customers can only see/edit their own data
  - Public boards are visible to everyone
  - Board owners have full control of their boards
  - Anyone can submit feedback
  - Only board owners can moderate feedback

### Migration 3: Authentication (003_setup_auth.sql)
- Creates a database function to auto-create customer records
- Sets up a trigger that runs when a new user signs up
- Auto-generates unique slugs for customer URLs

---

## Next Steps

After successfully running migrations:

1. ✅ Verify all tables exist
2. ✅ Test authentication by creating a user
3. ✅ Continue with building the application
4. 🚀 Ready to start coding!

---

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Migrations Best Practices](https://supabase.com/docs/guides/cli/local-development#database-migrations)

---

## Quick Command Reference

```bash
# Login to Supabase
npx supabase login

# Link to remote project
npx supabase link --project-ref xcxlstqrmsiiqnxkzfcj

# Push migrations
npx supabase db push

# Check for schema differences
npx supabase db diff

# Generate TypeScript types from database
npx supabase gen types typescript --local > types/database.types.ts
```
