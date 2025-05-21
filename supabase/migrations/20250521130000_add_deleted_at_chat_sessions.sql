ALTER TABLE chat_sessions
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS chat_sessions_deleted_at_idx ON chat_sessions (deleted_at);
