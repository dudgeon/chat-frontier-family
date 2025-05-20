
import { VoiceSessionState } from '@/types/voiceSession';

/**
 * Creates a WebSocket connection to the OpenAI realtime API via our Supabase edge function
 * @param setSession Function to update the voice session state
 * @param onClose Function to call when the connection is closed
 * @returns WebSocket connection or null if creation fails
 */
export const createVoiceWebSocket = async (
  setSession?: (updater: (prev: VoiceSessionState) => VoiceSessionState) => void,
  onClose?: () => void
): Promise<WebSocket | null> => {
  try {
    // Build the WebSocket URL from env vars
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const wsBase = supabaseUrl.replace(/^https?/, 'wss');
    const supabaseRealtimeEndpoint = `${wsBase}/functions/v1/realtime-chat?apikey=${anon}`;
    
    console.log('Creating WebSocket connection to:', supabaseRealtimeEndpoint);
    
    // Create and return the WebSocket connection
    const ws = new WebSocket(supabaseRealtimeEndpoint);
    
    // Set up event listeners for connection status
    ws.addEventListener('open', () => {
      console.log('WebSocket connection established');
      if (setSession) {
        setSession(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
        }));
      }
    });
    
    ws.addEventListener('error', (error) => {
      console.error('WebSocket connection error:', error);
      if (setSession) {
        setSession(prev => ({
          ...prev,
          isConnecting: false,
          error: 'Failed to connect to voice service'
        }));
      }
    });
    
    ws.addEventListener('close', (event) => {
      console.log(`WebSocket connection closed: ${event.code} - ${event.reason}`);
      if (setSession) {
        setSession(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false
        }));
      }
      if (onClose && (event.code !== 1000 || event.reason)) {
        onClose();
      }
    });
    
    return ws;
  } catch (error) {
    console.error('Error creating WebSocket connection:', error);
    if (setSession) {
      setSession(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Unknown connection error'
      }));
    }
    return null;
  }
};
