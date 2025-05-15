
import React from 'react';
import VoiceIcon from './voice/VoiceIcon';
import VoiceEffects from './voice/VoiceEffects';
import { useIndicatorState } from './voice/useIndicatorState';
import { VoiceSessionState } from '@/types/voiceSession';

interface VoiceIndicatorProps {
  session: VoiceSessionState;
  onClick?: () => void;
}

const VoiceIndicator: React.FC<VoiceIndicatorProps> = ({ session, onClick }) => {
  const { isConnected, isConnecting } = session;
  const { ripple, getBgColorClass } = useIndicatorState(session);
  
  return (
    <div className="relative">
      {/* Main indicator circle */}
      <div 
        className={`relative w-40 h-40 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-300 ${getBgColorClass()}`}
        onClick={isConnected || isConnecting ? undefined : onClick}
      >
        <VoiceIcon session={session} />
      </div>
      
      <VoiceEffects session={session} ripple={ripple} />
    </div>
  );
};

export default VoiceIndicator;
