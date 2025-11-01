-- Slack Estimation Tracker Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Create the estimations table
CREATE TABLE IF NOT EXISTS estimations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_name TEXT NOT NULL,
  items TEXT,
  ds_estimation TEXT,
  le_estimation TEXT,
  qa_estimation TEXT,
  slack_link TEXT,
  clickup_link TEXT,
  raw_thread TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_estimations_fund_name ON estimations(fund_name);
CREATE INDEX IF NOT EXISTS idx_estimations_created_at ON estimations(created_at DESC);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to call the function before any update
CREATE TRIGGER update_estimations_updated_at
  BEFORE UPDATE ON estimations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Note: For MVP, we are NOT implementing Row Level Security (RLS)
-- If you want to add security later, uncomment the following lines:
-- ALTER TABLE estimations ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all operations for now" ON estimations FOR ALL USING (true);
