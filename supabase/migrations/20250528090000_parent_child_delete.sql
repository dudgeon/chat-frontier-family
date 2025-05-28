-- Allow parents to delete child profiles and sessions

DROP POLICY IF EXISTS "Parents can delete their children profiles" ON public.profiles;
CREATE POLICY "Parents can delete their children profiles"
  ON public.profiles FOR DELETE TO authenticated
  USING (parent_id = auth.uid());

DROP POLICY IF EXISTS "Parents can update their children sessions" ON public.chat_sessions;
CREATE POLICY "Parents can update their children sessions"
  ON public.chat_sessions FOR UPDATE TO authenticated
  USING (
    user_id IN (SELECT id FROM public.profiles WHERE parent_id = auth.uid())
  )
  WITH CHECK (
    user_id IN (SELECT id FROM public.profiles WHERE parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "Parents can delete their children sessions" ON public.chat_sessions;
CREATE POLICY "Parents can delete their children sessions"
  ON public.chat_sessions FOR DELETE TO authenticated
  USING (
    user_id IN (SELECT id FROM public.profiles WHERE parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "Parents can delete their children messages" ON public.chat_messages;
CREATE POLICY "Parents can delete their children messages"
  ON public.chat_messages FOR DELETE TO authenticated
  USING (
    session_id IN (
      SELECT id FROM public.chat_sessions WHERE user_id IN (
        SELECT id FROM public.profiles WHERE parent_id = auth.uid()
      )
    )
  );
