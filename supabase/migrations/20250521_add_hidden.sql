-- Add soft-hide capability
ALTER TABLE chat_sessions
  ADD COLUMN hidden boolean NOT NULL DEFAULT false;

-- (optional) Ensure deleted_at column exists for audit
-- ALTER TABLE chat_sessions ADD COLUMN deleted_at timestamptz;
