-- 202505260040_add_image_url_to_chat_messages.sql
-- Add optional image_url column to chat_messages in an idempotent manner.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'chat_messages'
      AND column_name  = 'image_url'
  ) THEN
    ALTER TABLE public.chat_messages
      ADD COLUMN image_url text;
  END IF;
END $$;
