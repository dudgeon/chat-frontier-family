import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const bucket = Deno.env.get("IMAGE_BUCKET") ?? "chat-images";
const storagePublic = (Deno.env.get("STORAGE_PUBLIC") ?? "true") === "true";
const signedUrlTtl =
  parseInt(Deno.env.get("SIGNED_URL_TTL") ?? "") || 60 * 60 * 24 * 30;

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
        response_format: "b64_json",
        size: "1024x1024",
      }),
    },
  );

  if (!openaiResp.ok) {
    const text = await openaiResp.text();
    return errorResponse(openaiResp.status, text);
  }

  const data = await openaiResp.json();
  const b64 = data?.data?.[0]?.b64_json;

  // Debug log - remove in production
  console.log("OpenAI response data:", JSON.stringify(data));
  console.log("Extracted image base64 length:", b64?.length);

  if (!b64) {
    return errorResponse(500, "Failed to generate image");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseKey) {
    return errorResponse(500, "Supabase env vars not configured");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const arrayBuffer = bytes.buffer;
  const fileName = `${crypto.randomUUID()}.png`;
  const { error: uploadErr } = await supabase.storage
    .from(bucket)
    .upload(fileName, arrayBuffer, { contentType: "image/png" });
  if (uploadErr) {
    console.error("Upload error", uploadErr.message);
    return errorResponse(500, "Failed to upload image");
  }

  let storedUrl: string;
  if (storagePublic) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    storedUrl = data.publicUrl;
  } else {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(fileName, signedUrlTtl);
    if (error) {
      console.error("Signed URL error", error.message);
      return errorResponse(500, "Failed to sign image URL");
    }
    storedUrl = data.signedUrl;
  }

  return new Response(JSON.stringify({ url: storedUrl }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
