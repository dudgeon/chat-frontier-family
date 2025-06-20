DROP POLICY IF EXISTS "Parents can read their children sessions" ON public.chat_sessions;
CREATE POLICY "Parents can read their children sessions"
  ON public.chat_sessions FOR SELECT TO authenticated
  USING (
    user_id IN (
      SELECT id FROM public.profiles WHERE parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Parents can read their children messages" ON public.chat_messages;
CREATE POLICY "Parents can read their children messages"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (
    session_id IN (
      SELECT id FROM public.chat_sessions WHERE user_id IN (
        SELECT id FROM public.profiles WHERE parent_id = auth.uid()
      )
    )
  );
