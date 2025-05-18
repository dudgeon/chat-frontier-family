CREATE OR REPLACE FUNCTION public.set_session_name(_session_id text, _name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  trimmed text := trim(_name);
  new_name text :=
    CASE
      WHEN length(trimmed) <= 40 THEN trimmed
      ELSE rtrim(substr(trimmed, 1, 40)) || '…'
    END;
BEGIN
  UPDATE public.chat_sessions
     SET name = new_name
   WHERE id = _session_id
     AND name IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_session_name(text, text) TO authenticated;
