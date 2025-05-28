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

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return jsonResponse({ error: "Unauthorized" }, 401);

  const supabase = createClient(url, anon, {
    global: { headers: { authorization: `Bearer ${token}` } },
  });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return jsonResponse({ error: "id required" }, 400);

  if (req.method === "GET") {
    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("id, display_name, system_message")
      .eq("id", id)
      .maybeSingle();
    if (profErr) return jsonResponse({ error: profErr.message }, 500);

    const { data: sessions, error: sessErr } = await supabase
      .from("chat_sessions")
      .select("id, name, session_summary, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false });
    if (sessErr) return jsonResponse({ error: sessErr.message }, 500);

    return jsonResponse({ profile, sessions });
  }

  if (req.method === "PATCH") {
    let body: { display_name?: string; system_message?: string };
    try { body = await req.json(); } catch { body = {}; }
    const updates: Record<string, string> = {};
    if (typeof body.display_name === "string") updates.display_name = body.display_name;
    if (typeof body.system_message === "string") updates.system_message = body.system_message;
    if (Object.keys(updates).length === 0) {
      return jsonResponse({ error: "No fields to update" }, 400);
    }
    updates.updated_at = new Date().toISOString();
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id);
    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
});
