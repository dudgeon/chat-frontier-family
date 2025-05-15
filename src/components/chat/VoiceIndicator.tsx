
import React from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { VoiceSessionState } from '@/hooks/useVoiceSession';

interface VoiceIndicatorProps {
  session: VoiceSessionState;
  onClick?: () => void;
}

const VoiceIndicator: React.FC<VoiceIndicatorProps> = ({ session, onClick }) => {
  const { isConnecting, isConnected, isListening, isSpeaking } = session;
  
  let bgColorClass = '';
  
  if (isConnecting) {
    bgColorClass = 'bg-gray-600';
  } else if (isConnected && !isListening && !isSpeaking) {
    bgColorClass = 'bg-hero/80 hover:bg-hero';
  } else if (isListening) {
    bgColorClass = 'bg-red-500 animate-pulse';
  } else if (isSpeaking) {
    bgColorClass = 'bg-green-500';
  }
  
  return (
    <div 
      className={`relative w-40 h-40 rounded-full flex items-center justify-center cursor-pointer ${bgColorClass}`}
      onClick={isConnected || isConnecting ? undefined : onClick}
    >
      {isConnecting ? (
        <Loader2 className="h-16 w-16 text-white animate-spin" />
      ) : (
        <Mic className="h-16 w-16 text-white" />
      )}
    </div>
  );
};

export default VoiceIndicator;
