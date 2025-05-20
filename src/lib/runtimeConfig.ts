let cached: { supabaseUrl: string; supabaseAnonKey: string } | null = null;
export async function getRuntimeConfig() {
  if (cached) return cached;
  const r = await fetch("/functions/v1/config");
  cached = await r.json();
  return cached;
}
