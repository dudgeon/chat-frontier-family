
// Skip JWT checks – we’ll auth on the OpenAI side instead.
// Run: supabase functions deploy realtime-chat --no-verify-jwt
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  try {
    const upgradeHeader = req.headers.get("upgrade") || "";
    
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Handle WebSocket upgrade
    if (upgradeHeader.toLowerCase() === "websocket") {
      try {
        console.log("Upgrading to WebSocket connection");
        const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);
        
        // Connect to OpenAI's Realtime API
        const openAIKey = Deno.env.get('OPENAI_API_KEY');
        if (!openAIKey) {
          console.error("OPENAI_API_KEY is not set in environment variables");
          if (clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.close(1011, "OPENAI key not set");
          }
          return response;
        }

        console.log("Creating connection to OpenAI Realtime API");

        // Determine which model to use
        const openAIModel = Deno.env.get('OPENAI_MODEL') || 'gpt-4o';

        // Create the URL for OpenAI's Realtime API
        const openAIUrl = new URL("wss://api.openai.com/v1/realtime");
        openAIUrl.searchParams.append("model", openAIModel);

        console.log(`Connecting to: ${openAIUrl.toString()}`);
        
        const openaiResp = await fetch(openAIUrl, {
          headers: { Authorization: `Bearer ${openAIKey}` },
        });

        if (!openaiResp.ok || !openaiResp.webSocket) {
          clientSocket.close(
            1011,
            `OpenAI WS handshake failed: ${openaiResp.status}`,
          );
          return response;
        }

        const openAISocket = openaiResp.webSocket;
        await openAISocket.accept();

        openAISocket.onmessage = (e) => clientSocket.send(e.data);
        clientSocket.onmessage = (e) => openAISocket.send(e.data);

        openAISocket.onclose = (e) => clientSocket.close(e.code, e.reason);
        clientSocket.onclose = (e) => openAISocket.close(e.code, e.reason);

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
