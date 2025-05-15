
import React from 'react';
import { VoiceSessionState } from '@/types/voiceSession';

interface VoiceEffectsProps {
  session: VoiceSessionState;
  ripple: boolean;
}

/**
 * Component for rendering visual effects in the voice indicator
 */
const VoiceEffects: React.FC<VoiceEffectsProps> = ({ session, ripple }) => {
  const { isListening, isSpeaking } = session;
  
  return (
    <>
      {/* Ripple effect when state changes */}
      {ripple && (
        <div className="absolute inset-0 rounded-full animate-ping border-4 border-white/30"></div>
      )}
      
      {/* Pulse animation for listening state */}
      {isListening && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 rounded-full animate-ping opacity-25 bg-red-500"></div>
          <div className="absolute inset-0 rounded-full animate-pulse opacity-75 bg-red-500 animation-delay-500"></div>
        </div>
      )}
      
      {/* Subtle pulse animation for speaking state */}
      {isSpeaking && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 rounded-full animate-pulse opacity-50 bg-green-500"></div>
        </div>
      )}
    </>
  );
};

export default VoiceEffects;
