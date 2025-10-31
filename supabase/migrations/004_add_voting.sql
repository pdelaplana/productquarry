-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(feedback_id, user_email)
);

-- Add vote_count column to feedback table (for performance)
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS vote_count INTEGER DEFAULT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_votes_feedback_id ON votes(feedback_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_email ON votes(user_email);
CREATE INDEX IF NOT EXISTS idx_feedback_vote_count ON feedback(vote_count);

-- Create function to update vote count
-- SECURITY DEFINER allows the function to bypass RLS policies
CREATE OR REPLACE FUNCTION update_feedback_vote_count()
RETURNS TRIGGER
SECURITY DEFINER
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

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_vote_count ON votes;
CREATE TRIGGER trigger_update_vote_count
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_vote_count();
