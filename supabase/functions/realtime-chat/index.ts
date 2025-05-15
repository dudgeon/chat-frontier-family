
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const upgradeHeader = req.headers.get("upgrade") || "";
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Handle WebSocket upgrade
  if (upgradeHeader.toLowerCase() === "websocket") {
    try {
      const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);
      
      // Connect to OpenAI's Realtime API
      const openAIKey = Deno.env.get('OPENAI_API_KEY');
      if (!openAIKey) {
        throw new Error("OPENAI_API_KEY is not set");
      }

      const openAiUrl = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
      const openAISocket = new WebSocket(openAiUrl);
      
      console.log("Connecting to OpenAI Realtime API");
      
      // Handle messages from the client
      clientSocket.onmessage = (event) => {
        if (openAISocket.readyState === WebSocket.OPEN) {
          openAISocket.send(event.data);
          console.log("Sent message to OpenAI");
        } else {
          console.log("OpenAI socket not open, current state:", openAISocket.readyState);
        }
      };
      
      // Handle messages from OpenAI
      openAISocket.onmessage = (event) => {
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(event.data);
          console.log("Sent message to client");
        }
      };
      
      // Handle OpenAI socket events
      openAISocket.onopen = () => {
        console.log("OpenAI socket opened");
      };
      
      openAISocket.onerror = (e) => {
        console.error("OpenAI socket error:", e);
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({
            type: "error",
            message: "Error connecting to OpenAI Realtime API"
          }));
        }
      };
      
      openAISocket.onclose = (e) => {
        console.log("OpenAI socket closed:", e.code, e.reason);
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.close(e.code, e.reason);
        }
      };
      
      // Handle client socket events
      clientSocket.onclose = () => {
        console.log("Client socket closed");
        if (openAISocket.readyState === WebSocket.OPEN) {
          openAISocket.close();
        }
      };
      
      clientSocket.onerror = (e) => {
        console.error("Client socket error:", e);
      };
      
      return response;
    } catch (error) {
      console.error("WebSocket setup error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
  
  // Default response for non-WebSocket requests
  return new Response("Realtime Chat API - Use WebSocket connection", { headers: corsHeaders });
});
