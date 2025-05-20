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

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) {
    return jsonResponse({ error: "Missing Supabase env vars" }, 500);
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: req.headers.get("authorization")! } },
  });

  let body: { id?: string };
  try { body = await req.json(); } catch { body = {}; }

  if (!body.id) {
    return jsonResponse({ error: "id required" }, 400);
  }

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const { error } = await supabase
    .from("chat_sessions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", body.id)
    .eq("user_id", userData.user.id);

  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true });
});
