-- Allow parents to update child sessions and messages
DROP POLICY IF EXISTS "Parents can update their children sessions" ON public.chat_sessions;
CREATE POLICY "Parents can update their children sessions"
  ON public.chat_sessions FOR UPDATE TO authenticated
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

DROP POLICY IF EXISTS "Parents can update their children messages" ON public.chat_messages;
CREATE POLICY "Parents can update their children messages"
  ON public.chat_messages FOR UPDATE TO authenticated
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
