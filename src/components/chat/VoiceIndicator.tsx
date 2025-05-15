
import React, { useEffect, useState } from 'react';
import { Mic, Loader2, Volume2 } from 'lucide-react';
import { VoiceSessionState } from '@/hooks/useVoiceSession';

interface VoiceIndicatorProps {
  session: VoiceSessionState;
  onClick?: () => void;
}

const VoiceIndicator: React.FC<VoiceIndicatorProps> = ({ session, onClick }) => {
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
  
  return (
    <div className="relative">
      {/* Main indicator circle */}
      <div 
        className={`relative w-40 h-40 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-300 ${getBgColorClass()}`}
        onClick={isConnected || isConnecting ? undefined : onClick}
      >
        {/* Icon based on state */}
        {isConnecting ? (
          <Loader2 className="h-16 w-16 text-white animate-spin" />
        ) : isSpeaking ? (
          <Volume2 className="h-16 w-16 text-white animate-pulse" />
        ) : (
          <Mic className="h-16 w-16 text-white" />
        )}
      </div>
      
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
    </div>
  );
};

export default VoiceIndicator;
