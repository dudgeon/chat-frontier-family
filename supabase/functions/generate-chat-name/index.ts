import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_BASE = "https://api.openai.com";

function openaiHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    const { input, messages, session_id } = await req.json();
    const finalMessages = messages || input;
    if (!session_id) {
      return new Response(
        JSON.stringify({ error: "session_id required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (!finalMessages || !Array.isArray(finalMessages)) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing messages array" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
      Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseAdmin = supabaseUrl && serviceRole
      ? createClient(supabaseUrl, serviceRole)
      : null;

    const createResp = await fetch(`${OPENAI_BASE}/v1/chat/completions`, {
      method: "POST",
      headers: openaiHeaders(apiKey),
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: finalMessages,
        temperature: 0.3,
      }),
    });

    if (!createResp.ok) {
      console.error(
        "OpenAI error",
        createResp.status,
        await createResp.text(),
      );
      return new Response(
        JSON.stringify({ error: "Upstream OpenAI error" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await createResp.json();
    const text: string = data.choices?.[0]?.message?.content?.trim() ?? "";

    const matchJson = text.startsWith("{") && text.endsWith("}");
    let title = "";
    let sessionSummary = "";
    if (matchJson) {
      try {
        const parsed = JSON.parse(text);
        title = parsed.title ?? parsed.name ?? "";
        sessionSummary = parsed.summary ?? parsed.session_summary ?? "";
      } catch {
        title = text;
      }
    } else {
      const titleMatch = /title[:\-]*\s*(.+)/i.exec(text);
      const summaryMatch = /summary[:\-]*\s*(.+)/i.exec(text);
      if (titleMatch) title = titleMatch[1].trim();
      if (summaryMatch) sessionSummary = summaryMatch[1].trim();
      if (!title && !sessionSummary) {
        [title, sessionSummary] = text.split("\n", 2).map((s) => s.trim());
      }
    }

    if (supabaseAdmin) {
      const { error: updErr } = await supabaseAdmin
        .from("chat_sessions")
        .update({
          name: title,
          session_summary: sessionSummary.slice(0, 200),
          updated_at: new Date().toISOString(),
        })
        .eq("id", session_id);
      if (updErr) {
        console.error(
          "Failed to update session metadata",
          updErr.message,
        );
      }
    }

    return new Response(JSON.stringify({ title, session_summary: sessionSummary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-chat-name function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
