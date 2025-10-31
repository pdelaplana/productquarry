# Voting Feature Troubleshooting Guide

## Current Issue: Vote Counts Not Updating in UI

### Root Cause
The vote count is not updating because **database migration 004 has not been applied** to your Supabase database.

### What Migration 004 Does
Migration `004_add_voting.sql` performs the following critical operations:

1. **Creates the `votes` table** - Stores individual votes with:
   - `id`: Primary key
   - `feedback_id`: References feedback items
   - `user_email`: Who voted
   - `created_at`: When they voted
   - Unique constraint on (feedback_id, user_email) to prevent duplicate votes

2. **Adds `vote_count` column** to the `feedback` table - Stores the total vote count for performance

3. **Creates a PostgreSQL trigger function** - Automatically updates `vote_count` when votes are added or removed

4. **Creates the trigger** - Executes the function after INSERT or DELETE on the votes table

### Why Vote Counts Aren't Updating
Without migration 004 applied:
- The `vote_count` column doesn't exist in the `feedback` table
- Individual votes ARE being added/removed from the `votes` table successfully ✅
- But there's no `vote_count` column to display in the UI ❌
- The trigger doesn't exist to keep counts in sync ❌

### Evidence from Console Logs
Your console shows:
```javascript
toggleVote result: {success: true, data: {hasVoted: false, voteCount: 0}}
```

The `voteCount: 0` is returned from the server action at `server/actions/vote-actions.ts:102`, which queries the `feedback` table for `vote_count`. If this column doesn't exist, it returns as `null` or `0`.

## Solution: Apply Database Migrations

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to: **SQL Editor** (in the left sidebar)

### Step 2: Apply Migration 004
1. Open the file: `supabase/migrations/004_add_voting.sql`
2. Copy the entire contents
3. In Supabase SQL Editor, paste the SQL
4. Click **RUN** to execute

**What you should see:**
- "Success. No rows returned" or similar confirmation
- The `votes` table will be created
- The `vote_count` column will be added to `feedback` table
- The trigger function and trigger will be created

### Step 3: Apply Migration 005 (RLS Policies)
1. Open the file: `supabase/migrations/005_votes_rls.sql`
2. Copy the entire contents
3. In Supabase SQL Editor, paste the SQL
4. Click **RUN** to execute

**What you should see:**
- "Success. No rows returned"
- RLS policies will be enabled on the `votes` table

### Step 4: Verify Migration Success
Run this query in Supabase SQL Editor to verify:

```sql
-- Check if vote_count column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'feedback' AND column_name = 'vote_count';

-- Check if votes table exists
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'votes';

-- Check if trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_vote_count';
```

**Expected results:**
- First query should return: `vote_count | integer`
- Second query should return: `votes`
- Third query should return: `trigger_update_vote_count | INSERT | votes` and `trigger_update_vote_count | DELETE | votes`

### Step 5: Initialize Vote Counts for Existing Feedback
If you already have feedback items in your database, you need to initialize their vote counts:

```sql
-- Initialize vote_count for all existing feedback
UPDATE feedback
SET vote_count = (
  SELECT COUNT(*)
  FROM votes
  WHERE votes.feedback_id = feedback.id
);
```

### Step 6: Test the Feature
1. Reload your application
2. Click on a vote button
3. The vote count should now update immediately
4. Check the browser console - you should see logging like:
   ```
   Feedback fetched: [{id: "...", title: "...", vote_count: 1}]
   ```

## Verifying the Fix

After applying migrations, the vote count should update because:

1. ✅ The `vote_count` column exists and is selected by `getBoardFeedbackPublic`
2. ✅ The trigger automatically updates `vote_count` when votes change
3. ✅ React Query invalidation refetches the updated data
4. ✅ The UI re-renders with the new vote count

## Database Schema After Migrations

### `votes` Table
```sql
CREATE TABLE votes (
  id UUID PRIMARY KEY,
  feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(feedback_id, user_email)
);
```

### `feedback` Table (updated)
```sql
ALTER TABLE feedback
ADD COLUMN vote_count INTEGER DEFAULT 0;
```

### Trigger Function
```sql
CREATE FUNCTION update_feedback_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feedback SET vote_count = vote_count + 1 WHERE id = NEW.feedback_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feedback SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = OLD.feedback_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

## Common Issues After Applying Migrations

### Issue: "permission denied for table votes"
**Solution:** The RLS policies in migration 005 should fix this. Make sure you applied both migrations.

### Issue: Vote count shows 0 for items that have votes
**Solution:** Run the initialization query in Step 5 to count existing votes.

### Issue: TypeScript errors about vote_count
**Solution:** The type definitions should already include `vote_count` in the `Feedback` type at `types/database.ts`.

## Additional Debugging

If the issue persists after applying migrations, check the browser console for the feedback query log:

```javascript
console.log('Feedback fetched:', result.data?.map(f => ({
  id: f.id,
  title: f.title,
  vote_count: f.vote_count
})));
```

This will show you the actual `vote_count` values being returned from the database.

## Cleanup After Fix

Once voting is working correctly, you can remove the debug console.log statements from:
- `app/[slug]/page.tsx` (vote button click handler, mutation callbacks, and query)

## Migration History Tracking

To avoid this issue in the future, consider using the Supabase CLI to track and apply migrations automatically:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push all migrations
supabase db push
```

This will keep your local migration files in sync with your remote database.
