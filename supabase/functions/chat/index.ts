import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { waitForCompletion } from "./waitForCompletion.ts";

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

function errorResponse(status: number, message: string) {
  const statusCode = [401, 403, 404, 429].includes(status) ? status : 503;
  return new Response(JSON.stringify({ error: message }), {
    status: statusCode,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    const url = new URL(req.url);
    const streamRequested = url.searchParams.get("stream") === "true";

    const {
      input,
      messages,
      model = Deno.env.get("OPENAI_MODEL") || "gpt-4o",
      chat_id,
    } = await req.json();

    const finalMessages = messages || input;
    if (!finalMessages || !Array.isArray(finalMessages)) {
      return errorResponse(400, "Invalid or missing messages array");
    }

    const createResp = await fetch(`${OPENAI_BASE}/v1/responses`, {
      method: "POST",
      headers: openaiHeaders(apiKey),
      body: JSON.stringify({ model, input: finalMessages, store: true }),
    });

    if (!createResp.ok) {
      console.error("OpenAI error", await createResp.text());
      return errorResponse(createResp.status, "Upstream OpenAI error");
    }

    const creation = await createResp.json();
    const responseId = creation.id || createResp.headers.get("OpenAI-Response-Id");
    if (!responseId) {
      throw new Error("Invalid response ID from OpenAI");
    }

    if (streamRequested) {
      const eventsResp = await fetch(
        `${OPENAI_BASE}/v1/responses/${responseId}/events`,
        { headers: sseHeaders(apiKey) },
      );

      if (!eventsResp.ok || !eventsResp.body) {
        console.error("OpenAI events error", await eventsResp.text());
        return errorResponse(eventsResp.status, "Upstream OpenAI error");
      }

      const upstream = eventsResp.body;
      const start = Date.now();
      let logged = false;
      const stream = new ReadableStream({
        async start(controller) {
          const reader = upstream.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            controller.enqueue(value);
            if (!logged) {
              buffer += decoder.decode(value, { stream: true });
              if (buffer.includes("\n")) {
                console.log(
                  "[edgeLog]",
                  JSON.stringify({
                    chat_id,
                    openai_response_id: responseId,
                    latency_ms: Date.now() - start,
                  }),
                );
                logged = true;
              }
            }
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "X-Stream": "true",
        },
      });
    }

    const start = Date.now();
    const content = await waitForCompletion(OPENAI_BASE, responseId, apiKey);
    console.log(
      "[edgeLog]",
      JSON.stringify({
        chat_id,
        openai_response_id: responseId,
        latency_ms: Date.now() - start,
      }),
    );

    return new Response(JSON.stringify({ content }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Stream": "false",
      },
    });
  } catch (error) {
    console.error("Error in chat function:", (error as Error).message);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
