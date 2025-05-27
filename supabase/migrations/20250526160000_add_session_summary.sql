DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'chat_sessions'
        AND column_name = 'session_summary'
  ) THEN
    ALTER TABLE public.chat_sessions
      ADD COLUMN session_summary text NOT NULL DEFAULT '';
    COMMENT ON COLUMN public.chat_sessions.session_summary IS 'Model-generated recap (requested ≤140 chars; actual length may vary).';
  END IF;
END $$;
