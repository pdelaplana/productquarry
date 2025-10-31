-- Test if the trigger is working properly
-- Run this in Supabase SQL Editor

-- Step 1: Check current state
SELECT
  id,
  title,
  vote_count,
  (SELECT COUNT(*) FROM votes WHERE feedback_id = '6fdb0b2a-cac0-4906-b691-69dd94126552') as actual_votes
FROM feedback
WHERE id = '6fdb0b2a-cac0-4906-b691-69dd94126552';

-- Step 2: Verify trigger exists
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_vote_count';

-- Step 3: Verify function exists
SELECT
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'update_feedback_vote_count';

-- Step 4: Fix the vote_count to match actual votes
UPDATE feedback
SET vote_count = (
  SELECT COUNT(*)
  FROM votes
  WHERE votes.feedback_id = feedback.id
)
WHERE id = '6fdb0b2a-cac0-4906-b691-69dd94126552';

-- Step 5: Verify it's fixed
SELECT
  id,
  title,
  vote_count,
  (SELECT COUNT(*) FROM votes WHERE feedback_id = '6fdb0b2a-cac0-4906-b691-69dd94126552') as actual_votes
FROM feedback
WHERE id = '6fdb0b2a-cac0-4906-b691-69dd94126552';

-- Step 6: Test the trigger manually by inserting a test vote
-- (We'll delete it right after)
INSERT INTO votes (feedback_id, user_email)
VALUES ('6fdb0b2a-cac0-4906-b691-69dd94126552', 'test-trigger@example.com');

-- Check if vote_count increased
SELECT
  id,
  title,
  vote_count,
  (SELECT COUNT(*) FROM votes WHERE feedback_id = '6fdb0b2a-cac0-4906-b691-69dd94126552') as actual_votes
FROM feedback
WHERE id = '6fdb0b2a-cac0-4906-b691-69dd94126552';

-- Delete the test vote
DELETE FROM votes
WHERE feedback_id = '6fdb0b2a-cac0-4906-b691-69dd94126552'
  AND user_email = 'test-trigger@example.com';

-- Check if vote_count decreased
SELECT
  id,
  title,
  vote_count,
  (SELECT COUNT(*) FROM votes WHERE feedback_id = '6fdb0b2a-cac0-4906-b691-69dd94126552') as actual_votes
FROM feedback
WHERE id = '6fdb0b2a-cac0-4906-b691-69dd94126552';
