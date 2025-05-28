import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { input, messages, session_id } = await req.json();
    const finalMessages = messages || input;
    if (!session_id) {
      return new Response(
        JSON.stringify({ error: "session_id required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (!finalMessages || !Array.isArray(finalMessages)) {
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

    const createResp = await fetch(`${OPENAI_BASE}/v1/responses`, {
      method: "POST",
      headers: openaiHeaders(apiKey),
      body: JSON.stringify({
        model: "gpt-4o",
        input: finalMessages,
        store: true,
      }),
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

    const title = Array.isArray(data.output)
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
    let sessionSummary = "";
    if (supabaseAdmin) {
      const { data: history, error: histErr } = await supabaseAdmin
        .from("chat_messages")
        .select("content, is_user")
        .eq("session_id", session_id)
        .order("created_at", { ascending: true });

      if (histErr) {
        console.error("failed to fetch messages", histErr);
      } else {
        const summaryMessages = history.map((m: any) => ({
          role: m.is_user ? "user" : "assistant",
          content: m.content,
        }));
        try {
          const summaryResp = await fetch(
            `${OPENAI_BASE}/v1/chat/completions`,
            {
              method: "POST",
              headers: openaiHeaders(apiKey),
              body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                  {
                    role: "system",
                    content:
                      "Summarize the following conversation so far in **no more than 140 characters**. One sentence, no line breaks.",
                  },
                  ...summaryMessages,
                ],
                max_tokens: 80,
                temperature: 0.3,
              }),
            },
          );
          if (!summaryResp.ok) {
            console.error("OpenAI summary error", await summaryResp.text());
          } else {
            const sumData = await summaryResp.json();
            sessionSummary =
              sumData.choices?.[0]?.message?.content.trim() ?? "";
          }
        } catch (err) {
          console.error("OpenAI summary failure", err);
        }
      }
    }

    if (supabaseAdmin) {
      const { error: updErr } = await supabaseAdmin
        .from("chat_sessions")
        .update({
          name: title,
          session_summary: sessionSummary.slice(0, 200),
          updated_at: new Date().toISOString(),
        })
        .eq("id", session_id);
      if (updErr) {
        console.error(
          "Failed to update session metadata",
          updErr.message,
        );
      }
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
