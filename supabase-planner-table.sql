-- Planner Items Table for Daily Planner
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS planner_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  color TEXT DEFAULT '#6366f1',
  completed BOOLEAN DEFAULT false,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS planner_items_user_id_idx ON planner_items(user_id);
CREATE INDEX IF NOT EXISTS planner_items_date_idx ON planner_items(date);
CREATE INDEX IF NOT EXISTS planner_items_user_date_idx ON planner_items(user_id, date);

-- Enable Row Level Security
ALTER TABLE planner_items ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view their own planner items"
  ON planner_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own planner items"
  ON planner_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own planner items"
  ON planner_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own planner items"
  ON planner_items FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_planner_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS planner_items_updated_at ON planner_items;
CREATE TRIGGER planner_items_updated_at
  BEFORE UPDATE ON planner_items
  FOR EACH ROW
  EXECUTE FUNCTION update_planner_items_updated_at();
