
import { useState, useRef, useEffect } from 'react';
import { VoiceSessionState } from '@/types/voiceSession';
import { initializeRecorder, type AudioRecorder } from '@/utils/audioUtils';
import { createVoiceWebSocket, handleServerEvent, sendSessionUpdate } from '@/utils/voiceWebSocket';
import { encodeAudioData } from '@/utils/audioUtils';
import { toast } from '@/components/ui/use-toast';

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
    error: null,
  });

  // References to maintain WebSocket connection and audio processing
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const sessionActiveRef = useRef<boolean>(false);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 2;

  /**
   * Clean up resources when component unmounts
   */
  useEffect(() => {
    return () => {
      cleanupSession();
    };
  }, []);

  /**
   * Helper function to clean up all resources
   */
  const cleanupSession = () => {
    console.log('Cleaning up voice session resources');
    sessionActiveRef.current = false;
    
    // Stop recording if active
    if (recorderRef.current) {
      console.log('Stopping recorder');
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    
    // Close audio context if open
    if (audioContextRef.current) {
      console.log('Closing audio context');
      audioContextRef.current.close().catch(err => {
        console.warn('Error closing audio context:', err);
      });
      audioContextRef.current = null;
    }
    
    // Close WebSocket connection if open
    if (wsRef.current) {
      console.log('Closing WebSocket connection');
      if (wsRef.current.readyState === WebSocket.OPEN || 
          wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
    
    setSession(prev => ({
      ...prev, 
      isConnecting: false,
      isConnected: false,
      isListening: false,
      isSpeaking: false
    }));
  };

  /**
   * Initiates a new voice session
   * Establishes WebSocket connection and initializes audio recording
   */
  const startSession = async () => {
    try {
      console.log('Starting voice session');
      sessionActiveRef.current = true;
      
      // Reset any previous error state
      setSession(prev => ({ 
        ...prev, 
        isConnecting: true, 
        error: null 
      }));

      // Create WebSocket connection with timeout
      const connectTimeout = setTimeout(() => {
        console.log('WebSocket connection timed out');
        if (sessionActiveRef.current && !session.isConnected) {
          setSession(prev => ({
            ...prev,
            isConnecting: false,
            error: 'Connection timed out - please try again'
          }));
        }
      }, 15000);

      wsRef.current = await createVoiceWebSocket(
        (updater) => {
          // Only update state if session is still active
          if (sessionActiveRef.current) {
            setSession(updater);
          }
        }, 
        onClose
      );
      
      clearTimeout(connectTimeout);
      
      if (!wsRef.current) {
        throw new Error('Failed to establish WebSocket connection');
      }

      // Set up WebSocket message handler
      wsRef.current.onmessage = (event) => {
        try {
          // Parse and handle incoming WebSocket messages
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);
          
          if (!sessionActiveRef.current) {
            console.log('Session no longer active, ignoring message');
            return;
          }

          // Handle pong messages separately
          if (data.type === 'pong') {
            console.log('Received pong from server at:', data.time);
            return;
          }
          
          // Handle connection status messages
          if (data.type === 'connection_status') {
            console.log('Connection status update:', data.status);
            if (data.status === 'connected_to_openai') {
              console.log('Successfully connected to OpenAI through relay');
              
              // Reset reconnect attempts on successful connection
              reconnectAttemptsRef.current = 0;
            } else if (data.status === 'openai_disconnected') {
              console.log('OpenAI connection closed:', data.code, data.reason);
              
              if (data.code !== 1000 && data.code !== 1001) {
                setSession(prev => ({ 
                  ...prev, 
                  error: `OpenAI connection ended: ${data.reason}` 
                }));
              }
            }
            return;
          }
          
          handleServerEvent(data, setSession);
          
          // If session is created, send configuration
          if (data.type === 'session.created') {
            console.log('Session created, sending configuration');
            sendSessionUpdate(wsRef.current);
          }
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
          setSession(prev => ({ ...prev, error: 'Failed to process server response' }));
        }
      };

      // Initialize audio context with specific sample rate
      try {
        const audioContext = new AudioContext({
          sampleRate: 24000,
        });
        audioContextRef.current = audioContext;
        console.log('Audio context initialized with sample rate 24000Hz');
      } catch (e) {
        console.error('Failed to initialize audio context:', e);
        throw new Error('Could not access audio system. Please check your browser permissions.');
      }
      
      /**
       * Callback to handle audio data from the recorder
       * @param audioData - Float32Array containing audio samples
       */
      const handleAudioData = (audioData: Float32Array) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && sessionActiveRef.current) {
          try {
            // Encode audio data to base64 format
            const encodedAudio = encodeAudioData(audioData);
            
            // Send audio data to server
            wsRef.current.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: encodedAudio
            }));
          } catch (e) {
            console.error('Error sending audio data:', e);
          }
        }
      };
      
      // Initialize audio recorder with retry mechanism
      try {
        console.log('Initializing audio recorder');
        recorderRef.current = initializeRecorder(handleAudioData);
        
        // Set a timeout to check if we're actually getting audio
        setTimeout(() => {
          if (sessionActiveRef.current && !session.isListening) {
            console.log('Voice session started but no audio detected yet');
            toast({
              title: "Microphone Check",
              description: "Please say something to test your microphone",
            });
          }
        }, 5000);
      } catch (error) {
        console.error('Error initializing audio recorder:', error);
        throw new Error('Failed to access microphone. Please check your permissions.');
      }
      
    } catch (error) {
      console.error('Error starting voice session:', error);
      
      // Try to reconnect if we haven't reached max attempts
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        console.log(`Automatically retrying connection (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
        
        // Clean up any partially initialized resources
        cleanupSession();
        
        // Retry after a delay
        setTimeout(() => {
          if (sessionActiveRef.current) {
            startSession();
          }
        }, 1000);
        
        return;
      }
      
      setSession(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: error instanceof Error ? error.message : 'Unknown error starting voice session' 
      }));
      
      // Clean up any partially initialized resources
      cleanupSession();
      
      // Notify user
      toast({
        title: "Voice Mode Error",
        description: error instanceof Error ? error.message : 'Failed to start voice session',
        variant: "destructive",
      });
    }
  };

  /**
   * Ends the current voice session and cleans up resources
   */
  const endSession = () => {
    console.log('Manually ending voice session');
    cleanupSession();
    
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
