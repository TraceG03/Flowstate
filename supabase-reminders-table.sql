-- Reminders table
-- Run this in your Supabase SQL Editor

-- Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  date_time TIMESTAMPTZ NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_date_time ON reminders(date_time);
CREATE INDEX IF NOT EXISTS idx_reminders_dismissed ON reminders(dismissed);

-- Enable Row Level Security
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own reminders
CREATE POLICY "Users can view their own reminders" ON reminders
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own reminders" ON reminders
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reminders" ON reminders
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own reminders" ON reminders
  FOR DELETE
  USING (user_id = auth.uid());
