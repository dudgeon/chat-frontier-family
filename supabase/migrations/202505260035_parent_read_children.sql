-- 2025052600035_parent_read_children.sql
-- Allow parents to read (and optionally update) their children profiles.
-- Written idempotently for Postgres 14.

------------------------------------------------------------
-- 1.  Ensure RLS is enabled on profiles
------------------------------------------------------------
ALTER TABLE public.profiles
  ENABLE ROW LEVEL SECURITY;

------------------------------------------------------------
-- 2.  Parent SELECT access to child profiles
------------------------------------------------------------
DROP POLICY IF EXISTS "Parents can read their children profiles"
  ON public.profiles;

CREATE POLICY "Parents can read their children profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    user_role = 'child'
    AND parent_id = auth.uid()
  );

------------------------------------------------------------
-- 3.  (Optional) Parent UPDATE access to child profiles
--     Uncomment if you want adults to edit their kids' profiles
------------------------------------------------------------
-- DROP POLICY IF EXISTS "Parents can update their children profiles"
--   ON public.profiles;
--
-- CREATE POLICY "Parents can update their children profiles"
--   ON public.profiles
--   FOR UPDATE
--   TO authenticated
--   USING (
--     user_role = 'child'
--     AND parent_id = auth.uid()
--   )
--   WITH CHECK (
--     user_role = 'child'
--     AND parent_id = auth.uid()
--   );
