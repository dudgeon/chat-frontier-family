
import React from 'react';
import { Mic, Loader2, Volume2 } from 'lucide-react';
import { VoiceSessionState } from '@/types/voiceSession';

interface VoiceIconProps {
  session: VoiceSessionState;
}

/**
 * Component to display the appropriate icon based on voice session state
 */
const VoiceIcon: React.FC<VoiceIconProps> = ({ session }) => {
  const { isConnecting, isSpeaking } = session;
  
  if (isConnecting) {
    return <Loader2 className="h-16 w-16 text-white animate-spin" />;
  } 
  
  if (isSpeaking) {
    return <Volume2 className="h-16 w-16 text-white animate-pulse" />;
  }
  
  return <Mic className="h-16 w-16 text-white" />;
};

export default VoiceIcon;
