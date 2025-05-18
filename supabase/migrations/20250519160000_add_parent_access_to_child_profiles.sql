CREATE POLICY "Parents can read their children profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Parents can update their children profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());
