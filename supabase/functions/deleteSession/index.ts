import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

function jsonResponse(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;

  const jwtFromCaller =
    req.headers.get("authorization")?.replace("Bearer ", "");

  const supabase = createClient(url, anon, {
    global: {
      headers: { authorization: `Bearer ${jwtFromCaller}` },
    },
  });

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  if (!body.id) {
    return jsonResponse({ error: "id required" }, 400);
  }

  if (!jwtFromCaller) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const query = supabase
    .from("chat_sessions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", body.id);

  const { error } = await query;

  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true });
});
