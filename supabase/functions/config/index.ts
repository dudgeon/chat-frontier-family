import { corsHeaders } from "../_shared/cors.ts";

// Public function returning Supabase runtime configuration
Deno.serve((req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const body = {
    supabaseUrl: Deno.env.get("SUPABASE_URL"),
    supabaseAnonKey: Deno.env.get("SUPABASE_ANON_KEY"),
  };

  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
