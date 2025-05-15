
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
      console.log("Upgrading to WebSocket connection");
      const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);
      
      // Connect to OpenAI's Realtime API
      const openAIKey = Deno.env.get('OPENAI_API_KEY');
      if (!openAIKey) {
        throw new Error("OPENAI_API_KEY is not set in environment variables");
      }

      console.log("Creating connection to OpenAI Realtime API");
      const openAiUrl = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
      const openAISocket = new WebSocket(openAiUrl);
      let hasOpenAIConnection = false;
      
      // Handle messages from the client
      clientSocket.onmessage = (event) => {
        if (openAISocket.readyState === WebSocket.OPEN) {
          try {
            // Parse the message to check if it's a special command or regular message
            const message = JSON.parse(event.data);
            if (message.type === 'ping') {
              // Respond to ping with pong
              clientSocket.send(JSON.stringify({ type: 'pong', time: new Date().toISOString() }));
            } else {
              // Forward other messages to OpenAI
              openAISocket.send(event.data);
              console.log("Forwarded message to OpenAI:", message.type || 'unknown type');
            }
          } catch (e) {
            console.error("Error handling client message:", e);
            clientSocket.send(JSON.stringify({
              type: "error",
              message: "Failed to process message format"
            }));
          }
        } else {
          console.log("OpenAI socket not open, current state:", openAISocket.readyState);
          clientSocket.send(JSON.stringify({
            type: "error",
            message: "Connection to OpenAI not ready, please try again"
          }));
        }
      };
      
      // Handle messages from OpenAI
      openAISocket.onmessage = (event) => {
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(event.data);
          
          // Try to parse the message to log its type
          try {
            const data = JSON.parse(event.data);
            console.log("Relayed message from OpenAI:", data.type || 'unknown type');
          } catch {
            // Not JSON or couldn't parse, just relay it without logging details
            console.log("Relayed non-JSON data from OpenAI");
          }
        } else {
          console.log("Client socket closed, can't relay OpenAI message");
        }
      };
      
      // Handle OpenAI socket events
      openAISocket.onopen = () => {
        console.log("OpenAI socket opened successfully");
        hasOpenAIConnection = true;
        clientSocket.send(JSON.stringify({
          type: "connection_status",
          status: "connected_to_openai"
        }));
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
          clientSocket.send(JSON.stringify({
            type: "connection_status",
            status: "openai_disconnected",
            code: e.code,
            reason: e.reason || "Unknown reason"
          }));
          
          // Only close client socket for abnormal closures
          if (e.code !== 1000 && e.code !== 1001) {
            clientSocket.close(e.code, e.reason || "OpenAI connection closed");
          }
        }
      };
      
      // Handle client socket events
      clientSocket.onclose = (e) => {
        console.log("Client socket closed:", e.code, e.reason);
        if (openAISocket.readyState === WebSocket.OPEN || openAISocket.readyState === WebSocket.CONNECTING) {
          openAISocket.close(e.code, e.reason || "Client disconnected");
        }
      };
      
      clientSocket.onerror = (e) => {
        console.error("Client socket error:", e);
      };
      
      // Connection timeout if OpenAI doesn't connect in 10 seconds
      setTimeout(() => {
        if (!hasOpenAIConnection && clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({
            type: "error",
            message: "Timed out waiting for OpenAI connection"
          }));
        }
      }, 10000);
      
      return response;
    } catch (error) {
      console.error("WebSocket setup error:", error);
      return new Response(JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
  
  // Default response for non-WebSocket requests
  return new Response("Realtime Chat API - Use WebSocket connection", { headers: corsHeaders });
});
