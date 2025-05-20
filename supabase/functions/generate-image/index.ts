import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return errorResponse(503, "OpenAI API key not configured");
  }

  let body: { prompt?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const prompt = body.prompt;
  if (!prompt) {
    return errorResponse(400, "Missing prompt");
  }

  const openaiResp = await fetch(
    "https://api.openai.com/v1/images/generations",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
      }),
    },
  );

  if (!openaiResp.ok) {
    const text = await openaiResp.text();
    return errorResponse(openaiResp.status, text);
  }

  const data = await openaiResp.json();
  const url = data.data?.[0]?.url;
  return new Response(JSON.stringify({ url }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
