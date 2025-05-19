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

    const { input, messages } = await req.json();
    const finalInput = input || messages;
    if (!finalInput || !Array.isArray(finalInput)) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing messages array" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const createResp = await fetch(`${OPENAI_BASE}/v1/responses`, {
      method: "POST",
      headers: openaiHeaders(apiKey),
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: finalInput,
        store: true,
      }),
    });

    if (!createResp.ok) {
      const err = await createResp.json();
      return new Response(JSON.stringify(err), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const creation = await createResp.json();
    const responseId = creation.id;
    if (!responseId) {
      return new Response(
        JSON.stringify({ error: "Invalid response ID from OpenAI" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let data;
    for (let i = 0; i < 30; i++) {
      const finished = await fetch(
        `${OPENAI_BASE}/v1/responses/${responseId}`,
        {
          headers: openaiHeaders(apiKey),
        },
      );

      if (!finished.ok) {
        const err = await finished.json();
        return new Response(JSON.stringify(err), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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

    const title = data.responses[0].message.content;
    return new Response(JSON.stringify({ title }), {
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
