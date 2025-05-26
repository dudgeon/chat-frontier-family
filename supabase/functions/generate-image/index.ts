import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  const model = Deno.env.get("OPENAI_IMAGE_MODEL") || "dall-e-3";

  const openaiResp = await fetch(
    "https://api.openai.com/v1/images/generations",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
      }),
    },
  );

  if (!openaiResp.ok) {
    const text = await openaiResp.text();
    return errorResponse(openaiResp.status, text);
  }

  const data = await openaiResp.json();
  const url = data?.data?.[0]?.url;

  // Debug log - remove in production
  console.log("OpenAI response data:", JSON.stringify(data));
  console.log("Extracted image URL:", url);

  if (!url) {
    return errorResponse(502, "No image URL returned from OpenAI.");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseKey) {
    return errorResponse(500, "Supabase env vars not configured");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const bucket = "chat-images";
  const { error: bucketErr } = await supabase.storage.createBucket(bucket, {
    public: true,
  });
  if (bucketErr && !bucketErr.message.includes("already exists")) {
    console.error("Bucket creation failed", bucketErr.message);
  }

  const imageResp = await fetch(url);
  if (!imageResp.ok) {
    const text = await imageResp.text();
    return errorResponse(imageResp.status, text);
  }
  const arrayBuffer = await imageResp.arrayBuffer();
  const fileName = `${crypto.randomUUID()}.png`;
  const { error: uploadErr } = await supabase.storage
    .from(bucket)
    .upload(fileName, arrayBuffer, { contentType: "image/png", upsert: true });
  if (uploadErr) {
    console.error("Upload error", uploadErr.message);
    return errorResponse(500, "Failed to upload image");
  }

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(fileName);
  const storedUrl = publicData.publicUrl;

  return new Response(JSON.stringify({ url: storedUrl }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
