
import { useState } from 'react';
import { VoiceSessionState } from '@/types/voiceSession';
import { toast } from '@/components/ui/use-toast';

/**
 * Custom hook for managing voice session state
 * @returns Object containing session state and update functions
 */
export const useVoiceState = () => {
  // State to track the current status of the voice session
  const [session, setSession] = useState<VoiceSessionState>({
    isConnecting: false,
    isConnected: false,
    isListening: false,
    isSpeaking: false,
    transcript: '',
    error: null,
  });

  /**
   * Updates the session state when an error occurs
   * @param error Error message
   * @param showToast Whether to show a toast notification
   */
  const setError = (error: string, showToast = true) => {
    console.error('Voice session error:', error);
    
    setSession(prev => ({ 
      ...prev, 
      isConnecting: false, 
      error 
    }));
    
    if (showToast) {
      toast({
        title: "Voice Mode Error",
        description: error,
        variant: "destructive",
      });
    }
  };

  /**
   * Updates the session state when connecting
   */
  const setConnecting = () => {
    setSession(prev => ({ 
      ...prev, 
      isConnecting: true, 
      error: null 
    }));
  };

  /**
   * Updates the session state when connected
   */
  const setConnected = (connected: boolean) => {
    setSession(prev => ({ 
      ...prev, 
      isConnected: connected,
      isConnecting: false 
    }));
  };

  /**
   * Resets the session state
   */
  const resetSession = () => {
    setSession({
      isConnecting: false,
      isConnected: false,
      isListening: false,
      isSpeaking: false,
      transcript: '',
      error: null,
    });
  };

  return {
    session,
    setSession,
    setError,
    setConnecting,
    setConnected,
    resetSession
  };
};
