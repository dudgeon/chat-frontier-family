
import { useRef } from 'react';
import { createVoiceWebSocket, handleServerEvent, sendSessionUpdate } from '@/utils/voice';
import { VoiceSessionState } from '@/types/voiceSession';

/**
 * Custom hook for managing WebSocket connections in voice sessions
 * @param setSession Function to update session state
 * @param onClose Callback for when session ends
 * @param handleAudioChunk Callback for binary audio data
 * @returns Object containing WebSocket reference and connection functions
 */
export const useVoiceConnection = (
  setSession: (updater: (prev: VoiceSessionState) => VoiceSessionState) => void,
  onClose: () => void,
  handleAudioChunk: (chunk: ArrayBuffer) => void
) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 2;
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Initializes WebSocket connection
   * @returns Promise resolving to WebSocket or null
   */
  const initializeConnection = async (): Promise<WebSocket | null> => {
    try {
      // Clean up any existing connection first
      if (wsRef.current) {
        cleanupConnection();
      }
      
      // Clear any existing timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }

      // Create WebSocket connection with timeout
      connectionTimeoutRef.current = setTimeout(() => {
        console.log('WebSocket connection timed out');
        if (wsRef.current && wsRef.current.readyState !== WebSocket.OPEN) {
          setSession(prev => ({
            ...prev,
            isConnecting: false,
            error: 'Connection timed out - please try again'
          }));
          
          // Cleanup if still connecting
          if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
            wsRef.current.close();
          }
        }
      }, 20000); // 20 seconds timeout

      wsRef.current = await createVoiceWebSocket(
        (updater) => {
          setSession(updater);
        }, 
        onClose
      );
      
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      if (!wsRef.current) {
        throw new Error('Failed to establish WebSocket connection');
      }

      // Set up WebSocket message handler
      wsRef.current.onmessage = (event) => {
        if (typeof event.data !== 'string') {
          handleAudioChunk(event.data as ArrayBuffer);
          return;
        }
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);
          
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

      return wsRef.current;
    } catch (error) {
      console.error('Error initializing connection:', error);
      
      // Clean up timeout if it exists
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      return null;
    }
  };

  /**
   * Cleans up WebSocket connection
   */
  const cleanupConnection = () => {
    // Clean up timeout if it exists
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
    // Close WebSocket connection if open
    if (wsRef.current) {
      console.log('Closing WebSocket connection');
      try {
        if (wsRef.current.readyState === WebSocket.OPEN || 
            wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.close();
        }
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      }
      wsRef.current = null;
    }
  };

  /**
   * Gets current reconnect attempts count
   */
  const getReconnectAttempts = () => reconnectAttemptsRef.current;

  /**
   * Increments reconnect attempts count
   */
  const incrementReconnectAttempts = () => {
    reconnectAttemptsRef.current += 1;
    return reconnectAttemptsRef.current;
  };

  /**
   * Checks if max reconnect attempts reached
   */
  const isMaxReconnectAttemptsReached = () => reconnectAttemptsRef.current >= maxReconnectAttempts;

  return {
    wsRef,
    maxReconnectAttempts,
    initializeConnection,
    cleanupConnection,
    getReconnectAttempts,
    incrementReconnectAttempts,
    isMaxReconnectAttemptsReached
  };
};
