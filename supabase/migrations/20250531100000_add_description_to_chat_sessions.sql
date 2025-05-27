DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name   = 'chat_sessions'
        AND column_name  = 'description'
  ) THEN
    ALTER TABLE public.chat_sessions
      ADD COLUMN description text;
    COMMENT ON COLUMN public.chat_sessions.description IS '140-char recap, copied from session_summary when present';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.sync_chat_description()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.description IS NULL AND NEW.session_summary IS NOT NULL THEN
    NEW.description := left(trim(NEW.session_summary), 140);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_chat_description ON public.chat_sessions;
CREATE TRIGGER trg_sync_chat_description
BEFORE INSERT OR UPDATE ON public.chat_sessions
FOR EACH ROW EXECUTE PROCEDURE public.sync_chat_description();
