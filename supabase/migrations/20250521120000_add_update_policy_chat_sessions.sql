CREATE POLICY IF NOT EXISTS "Users can update their own sessions"
  ON public.chat_sessions FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
