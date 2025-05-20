/**
 * Supabase Edge Function for streaming chat completions.
 *
 * - Forwards chat messages to OpenAI with `stream: true`.
 * - Relays tokens to the client while accumulating the full assistant reply.
 * - Inserts the completed text into `chat_messages` and logs latency.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { pipeAndStore } from "./utils.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function errorResponse(status: number, msg: string) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function logMetrics(payload: Record<string, unknown>) {
  const enabled = Deno.env.get("ENABLE_METRICS");
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!enabled || !url || !key) return;
  try {
    await fetch(`${url}/rest/v1/edge_logs`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload }),
    });
  } catch (err) {
    console.error("metrics error", err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return errorResponse(503, "OpenAI API key not configured");
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const {
    chatId,
    messages = body.input,
    model = Deno.env.get("OPENAI_MODEL") || "gpt-4o",
  } = body;

  if (!messages || !Array.isArray(messages)) {
    return errorResponse(400, "Invalid or missing messages");
  }

  const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, stream: true, messages }),
  });

  if (!openaiResp.ok || !openaiResp.body) {
    return errorResponse(openaiResp.status, await openaiResp.text());
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

  const clientStream = pipeAndStore(openaiResp.body, chatId, supabase ?? {
    from() {
      return { insert: async () => {} };
    },
  }, (latency) => {
    const payload = { chat_id: chatId, latency_ms: latency };
    console.log("[edgeLog]", JSON.stringify(payload));
    logMetrics(payload);
  });

  return new Response(clientStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Access-Control-Allow-Origin": "*",
      "X-Accel-Buffering": "no",
    },
  });
});
