-- Enable RLS on votes table
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Anyone can view votes (for counting)
CREATE POLICY "Anyone can view votes" ON votes
  FOR SELECT USING (true);

-- Authenticated users can insert votes with their own email
CREATE POLICY "Users can insert their own votes" ON votes
  FOR INSERT WITH CHECK (
    auth.email() = user_email OR
    (auth.jwt() ->> 'email') = user_email
  );

-- Authenticated users can delete their own votes (for toggle)
CREATE POLICY "Users can delete their own votes" ON votes
  FOR DELETE USING (
    auth.email() = user_email OR
    (auth.jwt() ->> 'email') = user_email
  );
