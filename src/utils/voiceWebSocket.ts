
import { toast } from '@/components/ui/use-toast';
import { ServerEvent, VoiceSessionState } from '@/types/voiceSession';
import { supabase } from '@/integrations/supabase/client';

/**
 * Creates a WebSocket connection to the OpenAI Realtime API via Supabase Edge Function
 * @param setSession - Function to update the voice session state
 * @param onClose - Callback function to run when the session ends
 * @returns WebSocket instance and connection status
 */
export const createVoiceWebSocket = async (
  setSession: React.Dispatch<React.SetStateAction<VoiceSessionState>>,
  onClose: () => void
): Promise<WebSocket | null> => {
  try {
    // Update state to show connecting status
    setSession(prev => ({ ...prev, isConnecting: true }));

    // Get token from Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('realtime-token');
    
    if (error) {
      throw new Error(`Failed to get token: ${error.message}`);
    }

    // Get the full WebSocket URL for the Edge Function
    const projectId = 'xrrauvcciuiaztzajmeq';
    const wsUrl = `wss://${projectId}.supabase.co/functions/v1/realtime-chat`;
    
    console.log('Connecting to WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);

    // WebSocket event handlers
    ws.onopen = () => {
      // Connection established
      console.log('WebSocket connection opened');
      setSession(prev => ({ ...prev, isConnected: true, isConnecting: false }));
    };

    ws.onerror = (event) => {
      // Handle connection errors
      console.error('WebSocket error:', event);
      toast({
        title: 'Connection Error',
        description: 'Failed to establish voice connection',
        variant: 'destructive',
      });
      setSession(prev => ({ ...prev, isConnecting: false }));
    };

    ws.onclose = () => {
      // Reset state when connection closes
      console.log('WebSocket connection closed');
      setSession({
        isConnecting: false,
        isConnected: false,
        isListening: false,
        isSpeaking: false,
        transcript: '',
      });
      onClose();
    };

    return ws;
  } catch (error) {
    // Handle any errors during WebSocket initialization
    console.error('Error creating WebSocket:', error);
    toast({
      title: 'Connection Error',
      description: error instanceof Error ? error.message : 'Failed to start voice session',
      variant: 'destructive',
    });
    setSession(prev => ({ ...prev, isConnecting: false }));
    return null;
  }
};

/**
 * Handler for WebSocket server events
 * @param event - Event object received from the server
 * @param setSession - Function to update the voice session state
 */
export const handleServerEvent = (event: ServerEvent, setSession: (updater: (prev: VoiceSessionState) => VoiceSessionState) => void) => {
  if (event.type === 'session.created') {
    // Session created by server, log the event
    console.log('Session created:', event);
  } else if (event.type === 'session.updated') {
    console.log('Session updated:', event);
    // Start listening for voice input after session config is acknowledged
    setSession(prev => ({ ...prev, isListening: true }));
  } else if (event.type === 'input_audio_buffer.speech_started') {
    // User started speaking
    setSession(prev => ({ ...prev, isListening: true }));
  } else if (event.type === 'input_audio_buffer.speech_stopped') {
    // User stopped speaking
    setSession(prev => ({ ...prev, isListening: false }));
  } else if (event.type === 'response.audio_transcript.delta') {
    // Received partial transcript from AI response
    setSession(prev => ({ 
      ...prev, 
      isSpeaking: true,
      transcript: prev.transcript + (event.delta || '') 
    }));
  } else if (event.type === 'response.audio.done') {
    // AI finished speaking
    setSession(prev => ({ ...prev, isSpeaking: false }));
  }
};

/**
 * Sends session configuration update to the server
 * @param ws - WebSocket connection
 */
export const sendSessionUpdate = (ws: WebSocket | null) => {
  // Ensure WebSocket is open before sending
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  // Prepare session update configuration
  const sessionUpdateEvent = {
    type: "session.update",
    session: {
      // Enable both text and audio modalities
      modalities: ["text", "audio"],
      // Instructions for the AI assistant
      instructions: "You are a helpful, friendly assistant. Keep your responses brief and conversational. You're speaking, not writing.",
      // Voice selection for the AI
      voice: "alloy",
      // Audio format settings
      input_audio_format: "pcm16",
      output_audio_format: "pcm16",
      input_audio_transcription: {
        model: "whisper-1"
      },
      // Server-side voice activity detection settings
      turn_detection: {
        type: "server_vad",
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 1000
      }
    }
  };

  // Send configuration to the server
  ws.send(JSON.stringify(sessionUpdateEvent));
  console.log('Sent session update event');
};
