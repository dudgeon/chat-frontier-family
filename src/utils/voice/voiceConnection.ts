
import { SUPABASE_PROJECT_REF, OPENAI_MODEL } from '@/config/env';

/**
 * Creates a WebSocket connection to the OpenAI realtime API via our Supabase edge function
 * @returns WebSocket connection or null if creation fails
 */
export const createVoiceWebSocket = async (): Promise<WebSocket | null> => {
  try {
    // Use the Supabase edge function to establish the WebSocket connection
    const supabaseRealtimeEndpoint = `wss://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/realtime-chat`;
    
    console.log('Creating WebSocket connection to:', supabaseRealtimeEndpoint);
    
    // Create and return the WebSocket connection
    const ws = new WebSocket(supabaseRealtimeEndpoint);
    
    // Set up event listeners for connection status
    ws.addEventListener('open', () => {
      console.log('WebSocket connection established');
    });
    
    ws.addEventListener('error', (error) => {
      console.error('WebSocket connection error:', error);
    });
    
    ws.addEventListener('close', (event) => {
      console.log(`WebSocket connection closed: ${event.code} - ${event.reason}`);
    });
    
    return ws;
  } catch (error) {
    console.error('Error creating WebSocket connection:', error);
    return null;
  }
};
