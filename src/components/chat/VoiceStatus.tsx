
import React from 'react';
import { AlertCircle, InfoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceSessionState } from '@/types/voiceSession';

interface VoiceStatusProps {
  session: VoiceSessionState;
  connectionAttempts: number;
  maxAttempts: number;
  onRetry: () => void;
}

const VoiceStatus: React.FC<VoiceStatusProps> = ({ 
  session, 
  connectionAttempts,
  maxAttempts,
  onRetry
}) => {
  const { isConnecting, isConnected, isListening, isSpeaking, error, transcript } = session;

  const renderStatusText = () => {
    if (error) {
      return "Error: " + error;
    }
    if (isConnecting) return "Connecting to voice service...";
    if (isSpeaking) return "Assistant is speaking...";
    if (isListening) return "Listening to you...";
    if (isConnected) return "Ready - tap to speak";
    return "Starting voice mode...";
  };

  const getConnectionMessage = () => {
    if (connectionAttempts >= maxAttempts && !isConnected) {
      return "Unable to establish connection after multiple attempts";
    }
    return `Connection attempt ${connectionAttempts}/${maxAttempts}`;
  };

  const showRetryButton = error || (connectionAttempts >= maxAttempts && !isConnected);

  return (
    <>
      <div className="flex items-center gap-2">
        {error && <AlertCircle className="h-5 w-5 text-red-500" />}
        <p className="text-white text-xl font-medium">
          {renderStatusText()}
        </p>
      </div>
      
      {isConnecting && (
        <p className="text-white/60 text-sm">{getConnectionMessage()}</p>
      )}
      
      {transcript && (
        <div className="max-w-md w-full bg-white/10 rounded-lg p-4 mt-4 max-h-60 overflow-y-auto">
          <p className="text-white">{transcript}</p>
        </div>
      )}
      
      <div className="text-white/70 text-sm mt-4 text-center max-w-md">
        {isConnected && !isListening && !isSpeaking && (
          <p>Say something to start the conversation</p>
        )}
        
        {isConnecting && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <InfoIcon className="h-4 w-4 text-blue-300" />
            <p>If connection takes too long, try closing and reopening voice mode</p>
          </div>
        )}
        
        {showRetryButton && (
          <Button 
            variant="outline" 
            onClick={onRetry}
            className="mt-4 bg-white/10 hover:bg-white/20 text-white"
          >
            Try Again
          </Button>
        )}
      </div>
    </>
  );
};

export default VoiceStatus;
