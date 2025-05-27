DROP POLICY IF EXISTS "User can update session name/summary" ON public.chat_sessions;
CREATE POLICY "User can update session name/summary"
  ON public.chat_sessions FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
