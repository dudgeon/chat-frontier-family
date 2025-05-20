import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENAI_BASE = "https://api.openai.com";

function openaiHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "OpenAI-Beta": "responses=auto",
  };
}

function sseHeaders(apiKey: string) {
  return {
    ...openaiHeaders(apiKey),
    Accept: "text/event-stream",
  };
}

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

  const url = new URL(req.url);
  const stream = url.searchParams.get("stream") === "true" || body.stream === true;

  if (!messages || !Array.isArray(messages)) {
    return errorResponse(400, "Invalid or missing messages");
  }

  const createResp = await fetch(`${OPENAI_BASE}/v1/responses`, {
    method: "POST",
    headers: openaiHeaders(apiKey),
    body: JSON.stringify({ model, input: messages, store: true }),
  });

  if (!createResp.ok) {
    return errorResponse(createResp.status, await createResp.text());
  }

  const creation = await createResp.json().catch(() => ({}));
  const responseId = creation.id || createResp.headers.get("OpenAI-Response-Id");
  if (!responseId) {
    return errorResponse(503, "Missing response id");
  }

  if (stream) {
    const eventsUrl =
      `https://api.openai.com/v1/responses/${responseId}/events`;
    console.log("Fetching", eventsUrl);
    const eventsResp = await fetch(eventsUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "text/event-stream",
      },
    });
    if (!eventsResp.ok || !eventsResp.body) {
      return errorResponse(eventsResp.status, await eventsResp.text());
    }

    const start = Date.now();
    const [logStream, clientStream] = eventsResp.body.tee();
    (async () => {
      const reader = logStream.getReader();
      let logged = false;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!logged) {
          logged = true;
          const latency = Date.now() - start;
          const payload = {
            chat_id: chatId,
            openai_response_id: responseId,
            latency_ms: latency,
          };
          console.log("[edgeLog]", JSON.stringify(payload));
          await logMetrics(payload);
        }
      }
    })();

    console.log("Returning stream response", clientStream);
    return new Response(clientStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Access-Control-Allow-Origin": "*",
        "X-Accel-Buffering": "no",
      },
    });
  }

  const retrieveUrl = `${OPENAI_BASE}/v1/responses/${responseId}`;
  let data: any;
  for (let i = 0; i < 30; i++) {
    const res = await fetch(retrieveUrl, { headers: openaiHeaders(apiKey) });
    if (!res.ok) {
      return errorResponse(res.status, await res.text());
    }
    data = await res.json();
    if (data.status === "completed") break;
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (!data || data.status !== "completed") {
    return errorResponse(503, "Timed out waiting for OpenAI response");
  }

  const content = Array.isArray(data.output)
    ? data.output
        .flatMap((item: any) =>
          Array.isArray(item.content)
            ? item.content
                .filter((c: any) => c.type === "output_text")
                .map((c: any) => c.text)
            : [],
        )
        .join("")
    : data.output_text;

  return new Response(JSON.stringify({ content }), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "X-Stream": "false",
    },
  });
});
