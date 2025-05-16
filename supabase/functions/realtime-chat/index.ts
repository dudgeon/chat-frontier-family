
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
            clientSocket.send(JSON.stringify({
              type: "error",
              message: "Server configuration error: API key missing"
            }));
            
            clientSocket.close(1011, "Server configuration error");
          }
          
          return response;
        }

        console.log("Creating connection to OpenAI Realtime API");
        
        // Create the URL for OpenAI's Realtime API
        const openAiUrl = new URL("wss://api.openai.com/v1/realtime");
        openAiUrl.searchParams.append("model", "gpt-4o-realtime-preview-2024-10-01");
        
        console.log(`Connecting to: ${openAiUrl.toString()}`);
        
        // CRITICAL FIX: Create a properly formatted authorization header
        // Directly create a headers object using the Headers API (better cross-platform support)
        const authHeaders = new Headers();
        authHeaders.set("Authorization", `Bearer ${openAIKey}`);
        
        // Log that we're attempting connection with auth header (without showing the actual key)
        console.log("Attempting OpenAI connection with authorization header:", authHeaders.has("Authorization"));
        
        // Create WebSocket with authentication headers
        // Note: Using protocol array with empty string as first element is a special pattern
        // that works better with Deno WebSockets when sending headers
        const openAISocket = new WebSocket(openAiUrl.toString(), [""], {
          headers: {
            "Authorization": `Bearer ${openAIKey}`
          }
        });
        
        let hasOpenAIConnection = false;
        let connectionAttempts = 0;
        const maxConnectionAttempts = 3;
        
        // Set up timeout for OpenAI connection
        const openAIConnectTimeout = setTimeout(() => {
          if (!hasOpenAIConnection && clientSocket.readyState === WebSocket.OPEN) {
            console.log("Connection to OpenAI timed out");
            clientSocket.send(JSON.stringify({
              type: "error",
              message: "Connection to OpenAI timed out"
            }));
            
            if (connectionAttempts < maxConnectionAttempts) {
              connectionAttempts++;
              console.log(`Retrying OpenAI connection (attempt ${connectionAttempts}/${maxConnectionAttempts})`);
              
              if (openAISocket.readyState !== WebSocket.CLOSED) {
                openAISocket.close();
              }
            } else {
              clientSocket.close(1013, "Failed to connect to OpenAI after multiple attempts");
            }
          }
        }, 30000); // 30 seconds timeout
        
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
              
              // Detect error messages from OpenAI and log them
              if (data.type === "error") {
                console.error("Server sent error:", data);
              }
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
          clearTimeout(openAIConnectTimeout);
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
          clearTimeout(openAIConnectTimeout);
          
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
        clientSocket.onopen = () => {
          console.log("Client socket opened");
        };
        
        clientSocket.onclose = (e) => {
          console.log("Client socket closed:", e.code, e.reason);
          clearTimeout(openAIConnectTimeout);
          
          if (openAISocket.readyState === WebSocket.OPEN || openAISocket.readyState === WebSocket.CONNECTING) {
            openAISocket.close(e.code, e.reason || "Client disconnected");
          }
        };
        
        clientSocket.onerror = (e) => {
          console.error("Client socket error:", e);
        };
        
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
