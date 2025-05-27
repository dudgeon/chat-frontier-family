-- Add description column and parent update policies for child view

-- 1. add description column to chat_sessions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='chat_sessions'
      AND column_name='description'
  ) THEN
    ALTER TABLE public.chat_sessions
      ADD COLUMN description text;
    COMMENT ON COLUMN public.chat_sessions.description IS
      '140-char recap; synced from session_summary';
  END IF;
END $$;

-- 2. trigger to sync description from session_summary when absent
CREATE OR REPLACE FUNCTION public.sync_session_description()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.description IS NULL OR NEW.description = '' THEN
    IF NEW.session_summary IS NOT NULL AND NEW.session_summary <> '' THEN
      NEW.description := NEW.session_summary;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chat_sessions_description_sync ON public.chat_sessions;
CREATE TRIGGER chat_sessions_description_sync
BEFORE INSERT OR UPDATE ON public.chat_sessions
FOR EACH ROW EXECUTE FUNCTION public.sync_session_description();

-- 3. Parents can update their children sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Parents can update their children sessions" ON public.chat_sessions;
CREATE POLICY "Parents can update their children sessions"
  ON public.chat_sessions
  FOR UPDATE
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM public.profiles WHERE parent_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.profiles WHERE parent_id = auth.uid()
    )
  );

-- 4. Parents can update their children messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Parents can update their children messages" ON public.chat_messages;
CREATE POLICY "Parents can update their children messages"
  ON public.chat_messages
  FOR UPDATE
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM public.chat_sessions WHERE user_id IN (
        SELECT id FROM public.profiles WHERE parent_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.chat_sessions WHERE user_id IN (
        SELECT id FROM public.profiles WHERE parent_id = auth.uid()
      )
    )
  );
