
// Voice relay function with manual JWT verification.
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  try {
    const upgradeHeader = req.headers.get("upgrade") || "";

    // Check Authorization header for JWT
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;

    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY');

    if (!token || !supabaseUrl || !supabaseAnon) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseAnon);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }
    
    // Handle WebSocket upgrade
    if (upgradeHeader.toLowerCase() === "websocket") {
      try {
        console.log("Upgrading to WebSocket connection");
        const { socket: clientWs, response } = Deno.upgradeWebSocket(req);
        
        // Connect to OpenAI's Realtime API
        const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY');
        if (!OPENAI_KEY) {
          console.error("OPENAI_API_KEY is not set in environment variables");
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.close(1011, "OPENAI key not set");
          }
          return response;
        }

        console.log("Creating connection to OpenAI Realtime API");

        // Determine which model to use
        const openaiModel = Deno.env.get('OPENAI_MODEL') || 'gpt-4o';

        // Create the URL for OpenAI's Realtime API
        const openaiUrl = new URL("wss://api.openai.com/v1/realtime");
        openaiUrl.searchParams.append("model", openaiModel);

        console.log(`Connecting to: ${openaiUrl.toString()}`);

        const openaiResp = await fetch(openaiUrl, {
          headers: { Authorization: `Bearer ${OPENAI_KEY}` },
        });

        if (!openaiResp.ok || !openaiResp.webSocket) {
          clientWs.close(1011, `OpenAI handshake failed`);
          return response;
        }

        const openaiWs = openaiResp.webSocket;
        await openaiWs.accept();

        openaiWs.onmessage = (e) => clientWs.send(e.data);
        clientWs.onmessage = (e) => openaiWs.send(e.data);

        openaiWs.onclose = (e) => clientWs.close(e.code, e.reason);
        clientWs.onclose = (e) => openaiWs.close(e.code, e.reason);

        return response;
      } catch (error) {
        console.error("WebSocket setup error:", error);
        return new Response(JSON.stringify({ 
          error: error.message,
          stack: error.stack,
          time: new Date().toISOString()
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }
    
    // Default response for non-WebSocket requests
    return new Response("Realtime Chat API - Use WebSocket connection", { 
      headers: { ...corsHeaders, "Content-Type": "text/plain" } 
    });
  } catch (error) {
    console.error("General error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack,
      time: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
