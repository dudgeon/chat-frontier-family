
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VoiceIndicator from './VoiceIndicator';
import { useVoiceSession } from '@/hooks/useVoiceSession';

interface VoiceModeProps {
  onClose: () => void;
}

const VoiceMode: React.FC<VoiceModeProps> = ({ onClose }) => {
  const { session, startSession, endSession } = useVoiceSession(onClose);

  const renderStatus = () => {
    if (session.isConnecting) return "Connecting...";
    if (session.isSpeaking) return "Assistant is speaking...";
    if (session.isListening) return "Listening...";
    if (session.isConnected) return "Tap to speak";
    return "Starting voice mode...";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-md flex flex-col justify-center items-center z-50">
      <div className="absolute top-4 right-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={endSession}
          className="text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
      
      <div className="flex flex-col items-center justify-center gap-6">
        <VoiceIndicator 
          session={session}
          onClick={!session.isConnected && !session.isConnecting ? startSession : undefined} 
        />
        
        <p className="text-white text-xl font-medium">
          {renderStatus()}
        </p>
        
        {session.transcript && (
          <div className="max-w-md w-full bg-white/10 rounded-lg p-4 mt-4">
            <p className="text-white">{session.transcript}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceMode;
