-- Milestones table for Goals
-- Run this in your Supabase SQL Editor

-- Create milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster goal lookups
CREATE INDEX IF NOT EXISTS idx_milestones_goal_id ON milestones(goal_id);

-- Enable Row Level Security
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access milestones for their own goals
CREATE POLICY "Users can view their own milestones" ON milestones
  FOR SELECT
  USING (
    goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert their own milestones" ON milestones
  FOR INSERT
  WITH CHECK (
    goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own milestones" ON milestones
  FOR UPDATE
  USING (
    goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own milestones" ON milestones
  FOR DELETE
  USING (
    goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid())
  );

-- Alternative: If you want public access (no auth required), use these policies instead:
-- DROP POLICY IF EXISTS "Users can view their own milestones" ON milestones;
-- DROP POLICY IF EXISTS "Users can insert their own milestones" ON milestones;
-- DROP POLICY IF EXISTS "Users can update their own milestones" ON milestones;
-- DROP POLICY IF EXISTS "Users can delete their own milestones" ON milestones;
-- CREATE POLICY "Public access" ON milestones FOR ALL USING (true) WITH CHECK (true);
