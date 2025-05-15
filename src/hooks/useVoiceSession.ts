
import { useState, useRef, useEffect } from 'react';
import { VoiceSessionState } from '@/types/voiceSession';
import { initializeRecorder, type AudioRecorder } from '@/utils/audioUtils';
import { createVoiceWebSocket, handleServerEvent, sendSessionUpdate } from '@/utils/voiceWebSocket';
import { encodeAudioData } from '@/utils/audioUtils';

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
   * Initiates a new voice session
   * Establishes WebSocket connection and initializes audio recording
   */
  const startSession = async () => {
    try {
      // Create WebSocket connection
      wsRef.current = await createVoiceWebSocket(setSession, onClose);
      if (!wsRef.current) return;

      // Set up WebSocket message handler
      wsRef.current.onmessage = (event) => {
        try {
          // Parse and handle incoming WebSocket messages
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);
          
          handleServerEvent(data, setSession);
          
          // If session is created, send configuration
          if (data.type === 'session.created') {
            sendSessionUpdate(wsRef.current);
          }
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
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
      console.error('Error starting voice session:', error);
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
