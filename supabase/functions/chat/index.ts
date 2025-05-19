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

export async function handleRequest(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const start = Date.now();
  let chat_id = "";
  let openai_response_id = "";
  let error_code = 0;

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    const url = new URL(req.url);
    const streamRequested = url.searchParams.get("stream") === "true";

    const {
      messages,
      model = Deno.env.get("OPENAI_MODEL") || "gpt-4o",
      chat_id: bodyChatId,
    } = await req.json();

    chat_id = bodyChatId || "";

    if (!messages || !Array.isArray(messages)) {
      throw new Error("Invalid or missing messages array");
    }

    const createBody = {
      model,
      input: messages,
      store: true,
    };

    const createResp = await fetch(`${OPENAI_BASE}/v1/responses`, {
      method: "POST",
      headers: openaiHeaders(apiKey),
      body: JSON.stringify(createBody),
    });

    if (!createResp.ok) {
      error_code = createResp.status;
      throw new Error("Upstream OpenAI error");
    }

    const creation = await createResp.json();
    openai_response_id = creation.id;

    if (!openai_response_id) {
      throw new Error("Invalid response ID from OpenAI");
    }

    if (streamRequested) {
      const eventsResp = await fetch(
        `${OPENAI_BASE}/v1/responses/${openai_response_id}/events`,
        { headers: sseHeaders(apiKey) },
      );

      if (!eventsResp.ok) {
        error_code = eventsResp.status;
        throw new Error("Upstream OpenAI error");
      }

      const latency_ms = Date.now() - start;
      console.log(
        JSON.stringify({ chat_id, openai_response_id, latency_ms, error_code }),
      );
      return new Response(eventsResp.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    }

    let data: any;
    for (let i = 0; i < 30; i++) {
      const retrieve = await fetch(
        `${OPENAI_BASE}/v1/responses/${openai_response_id}`,
        { headers: openaiHeaders(apiKey) },
      );

      if (!retrieve.ok) {
        error_code = retrieve.status;
        throw new Error("Upstream OpenAI error");
      }

      data = await retrieve.json();

      if (data.status === "completed") break;
      await new Promise((res) => setTimeout(res, 1000));
    }

    if (!data || data.status !== "completed") {
      error_code = 504;
      throw new Error("Timed out waiting for OpenAI response");
    }

    const latency_ms = Date.now() - start;
    console.log(
      JSON.stringify({ chat_id, openai_response_id, latency_ms, error_code }),
    );

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    const latency_ms = Date.now() - start;
    console.log(
      JSON.stringify({ chat_id, openai_response_id, latency_ms, error_code }),
    );
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

serve(handleRequest);
