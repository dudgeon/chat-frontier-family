import { toast } from '@/components/ui/use-toast';
import { VoiceSessionState } from '@/types/voiceSession';

/**
 * Creates a WebSocket connection to the OpenAI Realtime API via Supabase Edge Function
 * @param setSession - Function to update the voice session state
 * @param onClose - Callback function to run when the session ends
 * @returns WebSocket instance and connection status
 */
export const createVoiceWebSocket = async (
  setSession: (updater: (prev: VoiceSessionState) => VoiceSessionState) => void,
  onClose: () => void
): Promise<WebSocket | null> => {
  try {
    // Update state to show connecting status
    setSession(prev => ({ ...prev, isConnecting: true }));

    // Direct reference to the project ID
    const projectRef = "xrrauvcciuiaztzajmeq"; 
    
    if (!projectRef) {
      throw new Error('Could not determine Supabase project reference');
    }

    // Get full WebSocket URL for the Edge Function
    const wsUrl = `wss://${projectRef}.supabase.co/functions/v1/realtime-chat`;
    
    console.log('Connecting to WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);

    // Increase connection timeout safety
    const connectionTimeout = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        console.error('WebSocket connection timeout');
        ws.close();
        setSession(prev => ({ 
          ...prev, 
          isConnecting: false,
          error: 'Connection timeout - please try again' 
        }));
      }
    }, 15000); // 15 seconds timeout

    // WebSocket event handlers
    ws.onopen = () => {
      // Connection established
      console.log('WebSocket connection opened');
      clearTimeout(connectionTimeout);
      setSession(prev => ({ ...prev, isConnected: true, isConnecting: false }));
    };

    ws.onerror = (event) => {
      // Handle connection errors
      console.error('WebSocket error:', event);
      clearTimeout(connectionTimeout);
      toast({
        title: 'Connection Error',
        description: 'Failed to establish voice connection',
        variant: 'destructive',
      });
      setSession(prev => ({ 
        ...prev, 
        isConnecting: false,
        error: 'WebSocket connection error' 
      }));
    };

    ws.onclose = (event) => handleConnectionClose(event, setSession, onClose, connectionTimeout);

    // Implement ping/pong to keep connection alive
    const pingInterval = setupPingPong(ws);
    
    // Clean up interval on close
    ws.addEventListener('close', () => {
      clearInterval(pingInterval);
    });

    return ws;
  } catch (error) {
    // Handle any errors during WebSocket initialization
    console.error('Error creating WebSocket:', error);
    toast({
      title: 'Connection Error',
      description: error instanceof Error ? error.message : 'Failed to start voice session',
      variant: 'destructive',
    });
    setSession(prev => ({ 
      ...prev, 
      isConnecting: false,
      error: error instanceof Error ? error.message : 'Unknown connection error'
    }));
    return null;
  }
};

/**
 * Handles WebSocket connection close events
 */
const handleConnectionClose = (
  event: CloseEvent,
  setSession: (updater: (prev: VoiceSessionState) => VoiceSessionState) => void,
  onClose: () => void,
  connectionTimeout: NodeJS.Timeout
) => {
  // Reset state when connection closes
  console.log('WebSocket connection closed with code:', event.code, 'reason:', event.reason);
  clearTimeout(connectionTimeout);
  
  setSession(prev => {
    // Only show error toast if it wasn't a normal closure
    if (event.code !== 1000 && event.code !== 1001) {
      toast({
        title: 'Connection Closed',
        description: `Voice session ended: ${event.reason || 'Unknown reason'}`,
        variant: 'default',
      });
      
      return {
        isConnecting: false,
        isConnected: false,
        isListening: false,
        isSpeaking: false,
        transcript: prev.transcript, // Preserve transcript
        error: `Connection closed: ${event.reason || 'Unknown reason'}`
      };
    }
    
    return {
      isConnecting: false,
      isConnected: false,
      isListening: false,
      isSpeaking: false,
      transcript: prev.transcript, // Preserve transcript
      error: null
    };
  });
  
  onClose();
};

/**
 * Sets up ping/pong mechanism to keep connection alive
 */
const setupPingPong = (ws: WebSocket): NodeJS.Timeout => {
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      console.log('Sending ping to keep connection alive');
      ws.send(JSON.stringify({ type: 'ping' }));
    } else if (ws.readyState !== WebSocket.CONNECTING) {
      // Clear interval if socket is closed or closing
      clearInterval(pingInterval);
    }
  }, 30000); // Send ping every 30 seconds
  
  return pingInterval;
};
