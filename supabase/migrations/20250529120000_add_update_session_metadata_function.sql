CREATE OR REPLACE FUNCTION public.update_session_metadata(
  _session_id text,
  _name text,
  _summary text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.chat_sessions
     SET name = _name,
         session_summary = _summary,
         updated_at = now()
   WHERE id = _session_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_session_metadata(text, text, text) TO authenticated;
