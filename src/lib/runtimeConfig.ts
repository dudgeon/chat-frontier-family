let cached: { supabaseUrl: string; supabaseAnonKey: string } | null = null;
export async function getRuntimeConfig() {
  if (cached) return cached;
  const projectRef = "xrrauvcciuiaztzajmeq"; // TODO: env or derive from anon key
  const r = await fetch(
    `https://${projectRef}.supabase.co/functions/v1/config`
  );
  cached = await r.json();
  return cached;
}
