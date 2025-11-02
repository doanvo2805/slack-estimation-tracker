-- Drop the urgency column from estimations table
-- Run this in your Supabase SQL Editor if the urgency column exists

ALTER TABLE estimations DROP COLUMN IF EXISTS urgency;
