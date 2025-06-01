import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { utf8Truncate } from "../../../src/utils/metadata/index.ts";

const OPENAI_BASE = "https://api.openai.com";

const systemPrompt = {
  role: "system",
  content:
    "You are an assistant that summarises a chat. " +
    'Return ONLY JSON like {"name":"<title>","summary":"<summary>"} ' +
    "with no extra text."
};

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

    const { input, messages: incoming, session_id } = await req.json();
    const history = (incoming || input || []) as unknown[];
    const messages = [systemPrompt, ...history.slice(-40)];
    if (!session_id) {
      return new Response(
        JSON.stringify({ error: "session_id required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (!history || !Array.isArray(history)) {
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
        model: Deno.env.get("OPENAI_METADATA_MODEL") ?? "gpt-4o-mini",
        messages,
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
    let title = "";
    let sessionSummary = "";
    try {
      ({ name: title, summary: sessionSummary } = JSON.parse(
        data.choices?.[0]?.message?.content ?? "{}"
      ));
    } catch {
      const text: string = data.choices?.[0]?.message?.content?.trim() ?? "";
      const matchJson = text.startsWith("{") && text.endsWith("}");
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
    }

    const summary = utf8Truncate(sessionSummary, 200);

    if (supabaseAdmin) {
      const { error: updErr, status } = await supabaseAdmin.rpc(
        "update_session_metadata",
        {
          _session_id: session_id,
          _name: title,
          _summary: summary,
        },
      );
      if (updErr) {
        if (status === 404) {
          console.warn("session deleted", session_id);
        } else {
          console.error(
            "Failed to update session metadata",
            updErr.message,
          );
        }
      }
    }

    if (Deno.env.get('DEBUG_META_LOGS')) {
      console.debug('metadata result', { title, sessionSummary });
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
