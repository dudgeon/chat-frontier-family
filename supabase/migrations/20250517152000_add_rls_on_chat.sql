-- 20250527152000_add_rls_on_chat.sql
-- Enable RLS and re-create policies without the unsupported
-- “IF NOT EXISTS” clause (Postgres <16).

/* ────────────────────────────────
   CHAT_SESSIONS
   ──────────────────────────────── */
ALTER TABLE public.chat_sessions
  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own sessions"
  ON public.chat_sessions;
CREATE POLICY "Users can read their own sessions"
  ON public.chat_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own sessions"
  ON public.chat_sessions;
CREATE POLICY "Users can insert their own sessions"
  ON public.chat_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

/* ────────────────────────────────
   CHAT_MESSAGES
   ──────────────────────────────── */
ALTER TABLE public.chat_messages
  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own messages"
  ON public.chat_messages;
CREATE POLICY "Users can read their own messages"
  ON public.chat_messages
  FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT id
      FROM public.chat_sessions
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own messages"
  ON public.chat_messages;
CREATE POLICY "Users can insert their own messages"
  ON public.chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    session_id IN (
      SELECT id
      FROM public.chat_sessions
      WHERE user_id = auth.uid()
    )
  );

/* ────────────────────────────────
   PROFILES
   ──────────────────────────────── */
ALTER TABLE public.profiles
  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own profile"
  ON public.profiles;
CREATE POLICY "Users can read their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own profile"
  ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());
