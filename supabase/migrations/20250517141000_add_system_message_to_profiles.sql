-- Add a system_message column only if it doesn't already exist
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS system_message text;
