# Supabase Setup Guide

## Prerequisites
- Create a Supabase account at https://supabase.com
- Create a new project

## Setup Steps

### 1. Create Supabase Project
1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in project details:
   - Name: `productquarry`
   - Database Password: (save this securely)
   - Region: Choose closest to your users

### 2. Get API Keys
1. Go to Project Settings > API
2. Copy the following values to your `.env.local`:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Run Database Migrations
1. Go to SQL Editor in your Supabase project
2. Run the following migration files in order:
   - `001_create_schema.sql` - Creates tables and indexes
   - `002_setup_rls.sql` - Sets up Row Level Security policies
   - `003_setup_auth.sql` - Configures authentication triggers

### 4. Configure Authentication
1. Go to Authentication > Providers
2. Enable Email provider
3. Configure email templates (optional)
4. Set up redirect URLs:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

### 5. Verify Setup
Run the following query in SQL Editor to verify tables:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

You should see: `customers`, `boards`, `feedback`

## Database Schema

### Customers
- `id` (UUID, PK) - Linked to auth.users.id
- `email` (TEXT, UNIQUE) - User email
- `name` (TEXT) - User display name
- `slug` (TEXT, UNIQUE) - URL-friendly identifier
- `created_at` (TIMESTAMP)

### Boards
- `id` (UUID, PK)
- `customer_id` (UUID, FK → customers.id)
- `name` (TEXT) - Board name
- `description` (TEXT) - Board description
- `slug` (TEXT, UNIQUE) - URL-friendly identifier
- `is_public` (BOOLEAN) - Whether board is publicly visible
- `requires_approval` (BOOLEAN) - Whether feedback needs approval
- `created_at` (TIMESTAMP)

### Feedback
- `id` (UUID, PK)
- `board_id` (UUID, FK → boards.id)
- `title` (TEXT) - Feedback title
- `description` (TEXT) - Feedback content
- `type` (TEXT) - One of: 'bug', 'improvement', 'feedback'
- `status` (TEXT) - One of: 'open', 'in_progress', 'completed', 'declined'
- `user_email` (TEXT) - Submitter email (optional)
- `is_approved` (BOOLEAN) - Approval status
- `created_at` (TIMESTAMP)

## Row Level Security Policies

### Customers
- Can read/update own data

### Boards
- Public boards readable by anyone
- Customers can CRUD own boards

### Feedback
- Anyone can submit feedback
- Public boards show approved feedback
- Board owners can see all feedback and manage it

## Testing

Test authentication:
```sql
-- Check if user was created in customers table
SELECT * FROM customers WHERE email = 'test@example.com';
```

Test RLS policies:
```sql
-- This should only return public boards
SELECT * FROM boards WHERE is_public = true;
```
