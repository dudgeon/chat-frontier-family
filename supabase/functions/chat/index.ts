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

serve(async (req) => {
  // Handle CORS preflight requests
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
      titleGeneration = false,
    } = await req.json();

    const finalMessages = messages || input;

    if (!finalMessages || !Array.isArray(finalMessages)) {
      throw new Error("Invalid or missing messages array");
    }

    const createBody: Record<string, unknown> = {
      model,
      input: finalMessages,
      store: true,
    };

    if (streamRequested) {
      createBody["stream"] = true;
    }

    const createResp = await fetch(`${OPENAI_BASE}/v1/responses`, {
      method: "POST",
      headers: streamRequested ? sseHeaders(apiKey) : openaiHeaders(apiKey),
      body: JSON.stringify(createBody),
    });

    if (!createResp.ok) {
      console.error("OpenAI error", await createResp.text());
      return new Response(
        JSON.stringify({ error: "Upstream OpenAI error" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (streamRequested) {
      return new Response(createResp.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    }

    const creation = await createResp.json();
    const responseId = creation.id;

    if (!responseId) {
      throw new Error("Invalid response ID from OpenAI");
    }

    // Poll for completion
    let data;
      for (let i = 0; i < 30; i++) {
        const retrieveUrl = `${OPENAI_BASE}/v1/responses/${responseId}`;
        const finished = await fetch(retrieveUrl, {
          headers: openaiHeaders(apiKey),
        });

        if (!finished.ok) {
          console.error("OpenAI error", await finished.text());
          return new Response(
            JSON.stringify({ error: "Upstream OpenAI error" }),
            {
              status: 502,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        data = await finished.json();

        if (data.status === "completed") {
          break;
        }

        await new Promise((res) => setTimeout(res, 1000));
      }

      if (!data || data.status !== "completed") {
        return new Response(
          JSON.stringify({ error: "Timed out waiting for OpenAI response" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
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
        },
      });
  } catch (error) {
    console.error("Error in chat function:", error.message);

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
