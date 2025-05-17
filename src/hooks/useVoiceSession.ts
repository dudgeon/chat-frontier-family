
import { useRef, useEffect, useCallback } from 'react';
import { useVoiceState } from './voice/useVoiceState';
import { useAudioRecorder } from './voice/useAudioRecorder';
import { useAudioPlayer } from './voice/useAudioPlayer';
import { useVoiceConnection } from './voice/useVoiceConnection';

/**
 * Custom hook that combines voice state, connection, and audio recording
 * for managing voice chat sessions
 * @param onClose - Callback function to execute when session ends
 * @returns Object containing session state and control functions
 */
export const useVoiceSession = (onClose: () => void) => {
  // State management
  const { 
    session, 
    setSession, 
    setError, 
    setConnecting, 
    setConnected,
    resetSession 
  } = useVoiceState();
  
  // Track if session is currently active to prevent memory leaks
  const sessionActiveRef = useRef<boolean>(false);
  const startAttemptRef = useRef<number>(0);
  const maxStartAttempts = 2;
  
  const { init: initPlayer, playChunk, cleanup: cleanupPlayer } = useAudioPlayer();

  // Initialize voice connection
  const {
    wsRef,
    maxReconnectAttempts,
    initializeConnection, 
    cleanupConnection, 
    getReconnectAttempts,
    incrementReconnectAttempts,
    isMaxReconnectAttemptsReached
  } = useVoiceConnection(setSession, onClose, playChunk);

  // Initialize audio recorder
  const {
    audioContextRef,
    initializeAudio,
    cleanupAudio
  } = useAudioRecorder(wsRef, sessionActiveRef, setError);
  
  /**
   * Starts a new voice session
   */
  const startSession = useCallback(async () => {
    try {
      // Prevent multiple simultaneous attempts
      if (sessionActiveRef.current) {
        console.log('Session already active, not starting a new one');
        return;
      }
      
      // Track attempt count
      startAttemptRef.current += 1;
      if (startAttemptRef.current > maxStartAttempts) {
        throw new Error('Unable to start session after multiple attempts');
      }
      
      console.log('Starting voice session (attempt ' + startAttemptRef.current + ')');
      sessionActiveRef.current = true;
      setConnecting();
      
      // Initialize WebSocket connection
      const ws = await initializeConnection();
      if (!ws) {
        throw new Error('Failed to establish WebSocket connection');
      }
      
      // Add delay before initializing audio to ensure connection is stable
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await initPlayer();

      // Initialize audio recording
      await initializeAudio();
      
      console.log('Voice session started successfully');
      
      // Reset attempt count on success
      startAttemptRef.current = 0;
    } catch (error) {
      console.error('Error starting voice session:', error);
      sessionActiveRef.current = false;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error starting session';
      setError(errorMessage);
      
      // Try to clean up partial connections
      cleanupConnection();
      cleanupAudio();
      
      // Reset session active flag
      sessionActiveRef.current = false;
    }
  }, [initializeConnection, initializeAudio, cleanupConnection, cleanupAudio, setConnecting, setError]);
  
  /**
   * Ends the current voice session
   */
  const endSession = useCallback(() => {
    console.log('Ending voice session');
    sessionActiveRef.current = false;
    
    // Clean up resources
    cleanupAudio();
    cleanupPlayer();
    cleanupConnection();
    resetSession();
    
    // Reset attempt counters
    startAttemptRef.current = 0;
    
    // Call the onClose callback
    onClose();
  }, [cleanupAudio, cleanupPlayer, cleanupConnection, resetSession, onClose]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (sessionActiveRef.current) {
        console.log('Component unmounting, cleaning up voice session');
        endSession();
      }
    };
  }, [endSession]);
  
  return {
    session,
    startSession,
    endSession,
  };
};
