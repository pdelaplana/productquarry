-- Enable Row Level Security on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Customers policies
-- Customers can read their own data
CREATE POLICY "Customers can read own data"
  ON customers FOR SELECT
  USING (auth.uid()::text = id::text);

-- Customers can update their own data
CREATE POLICY "Customers can update own data"
  ON customers FOR UPDATE
  USING (auth.uid()::text = id::text);

-- Boards policies
-- Anyone can read public boards
CREATE POLICY "Anyone can read public boards"
  ON boards FOR SELECT
  USING (is_public = true);

-- Customers can read their own boards
CREATE POLICY "Customers can read own boards"
  ON boards FOR SELECT
  USING (auth.uid()::text = customer_id::text);

-- Customers can insert their own boards
CREATE POLICY "Customers can create boards"
  ON boards FOR INSERT
  WITH CHECK (auth.uid()::text = customer_id::text);

-- Customers can update their own boards
CREATE POLICY "Customers can update own boards"
  ON boards FOR UPDATE
  USING (auth.uid()::text = customer_id::text);

-- Customers can delete their own boards
CREATE POLICY "Customers can delete own boards"
  ON boards FOR DELETE
  USING (auth.uid()::text = customer_id::text);

-- Feedback policies
-- Anyone can read approved feedback for public boards
CREATE POLICY "Anyone can read approved feedback on public boards"
  ON feedback FOR SELECT
  USING (
    is_approved = true AND
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = feedback.board_id
      AND boards.is_public = true
    )
  );

-- Board owners can read all feedback for their boards
CREATE POLICY "Board owners can read all feedback"
  ON feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = feedback.board_id
      AND auth.uid()::text = boards.customer_id::text
    )
  );

-- Anyone can insert feedback (for public submission)
CREATE POLICY "Anyone can submit feedback"
  ON feedback FOR INSERT
  WITH CHECK (true);

-- Board owners can update feedback on their boards
CREATE POLICY "Board owners can update feedback"
  ON feedback FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = feedback.board_id
      AND auth.uid()::text = boards.customer_id::text
    )
  );

-- Board owners can delete feedback on their boards
CREATE POLICY "Board owners can delete feedback"
  ON feedback FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = feedback.board_id
      AND auth.uid()::text = boards.customer_id::text
    )
  );
