-- 20250521133800_add_hidden.sql
-- Add soft-hide capability to chat_sessions, written so it can
-- be re-applied safely if the column already exists.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.columns
    WHERE  table_schema = 'public'
      AND  table_name   = 'chat_sessions'
      AND  column_name  = 'hidden'
  ) THEN
    ALTER TABLE public.chat_sessions
      ADD COLUMN hidden boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- (Optional but harmless to repeat)
CREATE INDEX IF NOT EXISTS chat_sessions_hidden_idx
  ON public.chat_sessions (hidden);
