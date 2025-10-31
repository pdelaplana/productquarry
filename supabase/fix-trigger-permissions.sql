-- Fix: Make the trigger function run with elevated permissions
-- This allows it to update the feedback table regardless of RLS policies

-- Drop and recreate the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_feedback_vote_count()
RETURNS TRIGGER
SECURITY DEFINER -- This makes the function run with the owner's permissions
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feedback
    SET vote_count = vote_count + 1
    WHERE id = NEW.feedback_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feedback
    SET vote_count = GREATEST(vote_count - 1, 0)
    WHERE id = OLD.feedback_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Sync all vote counts to match actual votes
UPDATE feedback
SET vote_count = (
  SELECT COUNT(*)
  FROM votes
  WHERE votes.feedback_id = feedback.id
);

-- Verify the fix
SELECT
  id,
  title,
  vote_count,
  (SELECT COUNT(*) FROM votes WHERE feedback_id = feedback.id) as actual_votes
FROM feedback
ORDER BY created_at DESC
LIMIT 5;
