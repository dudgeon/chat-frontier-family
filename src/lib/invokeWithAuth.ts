import { supabase } from "@/lib/supa";

export async function invokeWithAuth(fn: string, body: unknown) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return supabase.functions.invoke(fn, {
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
