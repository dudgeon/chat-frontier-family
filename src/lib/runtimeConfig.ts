const SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycmF1dmNjaXVpYXp0emFqbWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NDI3MTIsImV4cCI6MjA2MjMxODcxMn0.09L9ry63W4ivDZZKk1HMpLJeinZ-TUmeWdja9byANEM";

let cached: { supabaseUrl: string; supabaseAnonKey: string } | null = null;
export async function getRuntimeConfig() {
  if (cached) return cached;
  const r = await fetch("/functions/v1/config", {
    headers: { apikey: SUPABASE_ANON },
  });
  if (!r.ok) throw new Error("runtime config fetch failed");
  cached = await r.json();
  return cached;
}
