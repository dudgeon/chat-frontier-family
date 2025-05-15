
import React, { useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import VoiceIndicator from './VoiceIndicator';
import { useVoiceSession } from '@/hooks/useVoiceSession';

interface VoiceModeProps {
  onClose: () => void;
}

const VoiceMode: React.FC<VoiceModeProps> = ({ onClose }) => {
  const { session, startSession, endSession } = useVoiceSession(onClose);

  // Start session automatically when component mounts
  useEffect(() => {
    const initSession = async () => {
      try {
        // Check for microphone permissions first
        const hasPermission = await checkMicrophonePermission();
        if (hasPermission) {
          startSession();
        } else {
          toast({
            title: "Permission Required",
            description: "Please allow microphone access to use voice mode",
            variant: "destructive",
          });
          onClose();
        }
      } catch (error) {
        console.error('Error initializing session:', error);
        toast({
          title: "Voice Mode Error",
          description: "Failed to initialize voice mode",
          variant: "destructive",
        });
        onClose();
      }
    };
    
    initSession();
  }, []);
  
  // Handle errors in the session state
  useEffect(() => {
    if (session.error) {
      toast({
        title: "Voice Mode Error",
        description: session.error,
        variant: "destructive",
      });
    }
  }, [session.error]);

  // Helper function to check microphone permission
  const checkMicrophonePermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the tracks immediately, we just needed to check permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission error:', error);
      return false;
    }
  };

  const renderStatus = () => {
    if (session.error) {
      return "Error: " + session.error;
    }
    if (session.isConnecting) return "Connecting to voice service...";
    if (session.isSpeaking) return "Assistant is speaking...";
    if (session.isListening) return "Listening to you...";
    if (session.isConnected) return "Ready - tap to speak";
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
        
        <div className="flex items-center gap-2">
          {session.error && <AlertCircle className="h-5 w-5 text-red-500" />}
          <p className="text-white text-xl font-medium">
            {renderStatus()}
          </p>
        </div>
        
        {session.transcript && (
          <div className="max-w-md w-full bg-white/10 rounded-lg p-4 mt-4 max-h-60 overflow-y-auto">
            <p className="text-white">{session.transcript}</p>
          </div>
        )}
        
        <div className="text-white/70 text-sm mt-4">
          {session.isConnected && !session.isListening && !session.isSpeaking && (
            <p>Say something to start the conversation</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceMode;
