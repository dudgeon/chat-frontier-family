
import { useState, useEffect } from 'react';
import { VoiceSessionState } from '@/types/voiceSession';

/**
 * Custom hook to manage voice indicator visual state
 * @param session - Current voice session state
 * @returns Object containing ripple state and background color class
 */
export const useIndicatorState = (session: VoiceSessionState) => {
  const { isConnecting, isConnected, isListening, isSpeaking } = session;
  const [ripple, setRipple] = useState(false);
  
  // Trigger ripple effect when state changes
  useEffect(() => {
    if (isListening || isSpeaking) {
      setRipple(true);
      const timer = setTimeout(() => setRipple(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isListening, isSpeaking]);
  
  // Determine background color based on session state
  const getBgColorClass = () => {
    if (isConnecting) {
      return 'bg-gray-600';
    } else if (isConnected && !isListening && !isSpeaking) {
      return 'bg-hero/80 hover:bg-hero';
    } else if (isListening) {
      return 'bg-red-500';
    } else if (isSpeaking) {
      return 'bg-green-500';
    }
    return '';
  };
  
  return {
    ripple,
    getBgColorClass,
  };
};
