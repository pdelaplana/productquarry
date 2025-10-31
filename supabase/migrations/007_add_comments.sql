-- Add comments table for feedback discussions
-- Comments are flat (single-level), not nested

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 1000),
  is_official BOOLEAN DEFAULT false NOT NULL,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_comments_feedback_id ON comments(feedback_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_email ON comments(user_email);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Add comment count to feedback table for efficient display
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0 NOT NULL;

-- Function to update comment count
CREATE OR REPLACE FUNCTION update_feedback_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feedback
    SET comment_count = comment_count + 1
    WHERE id = NEW.feedback_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feedback
    SET comment_count = GREATEST(comment_count - 1, 0)
    WHERE id = OLD.feedback_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update comment count
DROP TRIGGER IF EXISTS on_comment_change ON comments;
CREATE TRIGGER on_comment_change
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_feedback_comment_count();

-- Function to update edited_at timestamp
CREATE OR REPLACE FUNCTION update_comment_edited_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update edited_at if content actually changed
  IF NEW.content IS DISTINCT FROM OLD.content THEN
    NEW.edited_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set edited_at on content update
DROP TRIGGER IF EXISTS on_comment_update ON comments;
CREATE TRIGGER on_comment_update
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_edited_at();

-- Row Level Security Policies

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- SELECT: Anyone can read comments on approved feedback of public boards
CREATE POLICY "Anyone can read comments on public approved feedback"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM feedback f
      JOIN boards b ON f.board_id = b.id
      WHERE f.id = comments.feedback_id
        AND f.is_approved = true
        AND b.is_public = true
    )
  );

-- INSERT: Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_email = auth.email()
    AND EXISTS (
      SELECT 1 FROM feedback f
      JOIN boards b ON f.board_id = b.id
      WHERE f.id = feedback_id
        AND f.is_approved = true
        AND b.is_public = true
    )
  );

-- UPDATE: Users can update only their own comments (content only)
CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND user_email = auth.email()
  )
  WITH CHECK (
    user_email = auth.email()
    -- Only allow updating content and edited_at, not other fields
    AND feedback_id = (SELECT feedback_id FROM comments WHERE id = comments.id)
  );

-- DELETE: Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND user_email = auth.email()
  );

-- DELETE: Board owners can delete any comment on their boards
CREATE POLICY "Board owners can delete comments on their boards"
  ON comments FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM feedback f
      JOIN boards b ON f.board_id = b.id
      JOIN customers c ON b.customer_id = c.id
      WHERE f.id = comments.feedback_id
        AND c.id = auth.uid()
    )
  );

-- UPDATE: Board owners can mark comments as official on their boards
CREATE POLICY "Board owners can mark comments as official"
  ON comments FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM feedback f
      JOIN boards b ON f.board_id = b.id
      JOIN customers c ON b.customer_id = c.id
      WHERE f.id = comments.feedback_id
        AND c.id = auth.uid()
    )
  );
