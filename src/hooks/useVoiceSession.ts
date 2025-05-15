
import { useRef, useEffect, useCallback } from 'react';
import { useVoiceState } from './voice/useVoiceState';
import { useAudioRecorder } from './voice/useAudioRecorder';
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
  
  // Initialize voice connection
  const { 
    wsRef, 
    maxReconnectAttempts,
    initializeConnection, 
    cleanupConnection, 
    getReconnectAttempts,
    incrementReconnectAttempts,
    isMaxReconnectAttemptsReached
  } = useVoiceConnection(setSession, onClose);
  
  // Initialize audio recorder
  const { 
    audioContextRef,
    recorderRef,
    initializeAudio, 
    cleanupAudio 
  } = useAudioRecorder(wsRef, sessionActiveRef, setError);
  
  /**
   * Starts a new voice session
   */
  const startSession = useCallback(async () => {
    try {
      console.log('Starting voice session');
      sessionActiveRef.current = true;
      setConnecting();
      
      // Initialize WebSocket connection
      const ws = await initializeConnection();
      if (!ws) {
        throw new Error('Failed to establish WebSocket connection');
      }
      
      // Initialize audio recording
      await initializeAudio();
      
      console.log('Voice session started successfully');
    } catch (error) {
      console.error('Error starting voice session:', error);
      sessionActiveRef.current = false;
      setError(error instanceof Error ? error.message : 'Unknown error starting session');
      
      // Try to clean up partial connections
      cleanupConnection();
      cleanupAudio();
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
    cleanupConnection();
    resetSession();
    
    // Call the onClose callback
    onClose();
  }, [cleanupAudio, cleanupConnection, resetSession, onClose]);
  
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
