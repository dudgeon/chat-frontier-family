
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { initializeRecorder, encodeAudioData, type AudioRecorder } from '@/utils/audioUtils';

/**
 * Interface for tracking the state of a voice session
 * @property isConnecting - Whether the connection is being established
 * @property isConnected - Whether the WebSocket connection is established
 * @property isListening - Whether the AI is currently listening (user speaking)
 * @property isSpeaking - Whether the AI is currently speaking
 * @property transcript - The current transcript of the AI's response
 */
export interface VoiceSessionState {
  isConnecting: boolean;
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
}

/**
 * Custom hook for managing voice chat sessions with OpenAI
 * @param onClose - Callback function to run when the session ends
 * @returns Object containing session state and control methods
 */
export const useVoiceSession = (onClose: () => void) => {
  // State to track the current status of the voice session
  const [session, setSession] = useState<VoiceSessionState>({
    isConnecting: false,
    isConnected: false,
    isListening: false,
    isSpeaking: false,
    transcript: '',
  });

  // References to maintain WebSocket connection and audio processing
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);

  /**
   * Clean up resources when component unmounts
   */
  useEffect(() => {
    return () => {
      // Stop recording if active
      if (recorderRef.current) recorderRef.current.stop();
      // Close audio context if open
      if (audioContextRef.current) audioContextRef.current.close();
      // Close WebSocket connection if open
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  /**
   * Handles different event types from the server
   * @param event - The event object received from the server
   */
  const handleServerEvent = (event: any) => {
    if (event.type === 'session.created') {
      // Session created by server, send configuration
      sendSessionUpdate();
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
   * Sends session configuration to the server
   * Called after a successful connection is established
   */
  const sendSessionUpdate = () => {
    // Ensure WebSocket is open before sending
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

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
    wsRef.current.send(JSON.stringify(sessionUpdateEvent));
    console.log('Sent session update event');
  };

  /**
   * Initiates a new voice session
   * Establishes WebSocket connection and initializes audio recording
   */
  const startSession = async () => {
    try {
      // Update state to show connecting status
      setSession(prev => ({ ...prev, isConnecting: true }));

      // Get token from Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('realtime-token');
      
      if (error) {
        throw new Error(`Failed to get token: ${error.message}`);
      }

      // Initialize WebSocket with the correct project ID
      const wsUrl = `wss://xrrauvcciuiaztzajmeq.functions.supabase.co/realtime-chat`;
      console.log('Connecting to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // WebSocket event handlers
      ws.onopen = () => {
        // Connection established
        console.log('WebSocket connection opened');
        setSession(prev => ({ ...prev, isConnected: true, isConnecting: false }));
      };

      ws.onmessage = (event) => {
        try {
          // Parse and handle incoming WebSocket messages
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);
          
          handleServerEvent(data);
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
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
      };

      // Initialize audio context with specific sample rate
      const audioContext = new AudioContext({
        sampleRate: 24000,
      });
      audioContextRef.current = audioContext;
      
      /**
       * Callback to handle audio data from the recorder
       * @param audioData - Float32Array containing audio samples
       */
      const handleAudioData = (audioData: Float32Array) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          // Encode audio data to base64 format
          const encodedAudio = encodeAudioData(audioData);
          
          // Send audio data to server
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: encodedAudio
          }));
        }
      };
      
      // Initialize audio recorder
      recorderRef.current = initializeRecorder(handleAudioData);
      
    } catch (error) {
      // Handle any errors during session initialization
      console.error('Error starting voice session:', error);
      toast({
        title: 'Connection Error',
        description: error instanceof Error ? error.message : 'Failed to start voice session',
        variant: 'destructive',
      });
      setSession(prev => ({ ...prev, isConnecting: false }));
    }
  };

  /**
   * Ends the current voice session and cleans up resources
   */
  const endSession = () => {
    // Stop the audio recorder
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    
    // Close the audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Close the WebSocket connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Execute the onClose callback
    onClose();
  };

  // Return the session state and control functions
  return {
    session,
    startSession,
    endSession
  };
};
