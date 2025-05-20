import { corsHeaders } from "../_shared/cors.ts";
Deno.serve((_req) =>
  new Response(
    JSON.stringify({
      supabaseUrl: Deno.env.get("SUPABASE_URL"),
      supabaseAnonKey: Deno.env.get("SUPABASE_ANON_KEY"),
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  ),
);
