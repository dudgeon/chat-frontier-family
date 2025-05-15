
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
  
  // Create token endpoint for WebRTC
  if (req.method === "POST" && new URL(req.url).pathname === "/realtime-token") {
    try {
      const openAIKey = Deno.env.get('OPENAI_API_KEY');
      if (!openAIKey) {
        throw new Error("OPENAI_API_KEY is not set");
      }

      // Request an ephemeral token from OpenAI
      const tokenResponse = await fetch("https://api.openai.com/v1/realtime/sessions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openAIKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2024-10-01",
          voice: "alloy",
          instructions: "You are a helpful assistant who speaks in conversational language."
        }),
      });
      
      const data = await tokenResponse.json();
      console.log("Token created:", data);
      
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Token error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
  
  // Fallback for all other requests
  return new Response("Realtime Chat API - Use WebSocket connection", { headers: corsHeaders });
});
