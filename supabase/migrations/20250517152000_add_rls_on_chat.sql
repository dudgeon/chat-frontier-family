ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
-- Row level security for chat sessions
CREATE POLICY IF NOT EXISTS "Users can read their own sessions"
  ON public.chat_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can insert their own sessions"
  ON public.chat_sessions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can read their own messages"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (
    session_id IN (
      SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can insert their own messages"
  ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()
    )
  );

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can read their own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
