
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import VoiceIndicator from './VoiceIndicator';
import VoiceStatus from './VoiceStatus';
import { useVoiceSession } from '@/hooks/voice';
import { useVoicePermissions } from '@/hooks/useVoicePermissions';
import { useChat } from '@/contexts/ChatContext';

interface VoiceModeProps {
  onClose: () => void;
}

const VoiceMode: React.FC<VoiceModeProps> = ({ onClose }) => {
  const { session, startSession, endSession } = useVoiceSession(onClose);
  const { apiKey } = useChat(); // Get API key from chat context
  
  const { 
    permissionStatus, 
    connectionAttempts, 
    maxAttempts, 
    handleRetry, 
    initSession 
  } = useVoicePermissions(
    startSession,
    session.isConnected,
    session.isConnecting,
    !!session.error,
    3 // maxAttempts
  );

  // Start session automatically when component mounts
  useEffect(() => {
    // Check if API key is available
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please add your OpenAI API key in Settings to use voice mode.",
        variant: "destructive",
      });
      endSession();
      return;
    }
    
    // Add small delay before initializing to ensure component is fully mounted
    const initTimer = setTimeout(() => {
      initSession();
    }, 300);
    
    // Display help toast after a delay if still connecting
    const helpTimer = setTimeout(() => {
      if (!session.isConnected && !session.error && session.isConnecting) {
        toast({
          title: "Establishing Connection",
          description: "Secure connection to voice service in progress...",
        });
      }
    }, 5000);
    
    return () => {
      clearTimeout(initTimer);
      clearTimeout(helpTimer);
    };
  }, [apiKey]);
  
  // Handle errors in the session state
  useEffect(() => {
    if (session.error) {
      toast({
        title: "Voice Mode Issue",
        description: session.error,
        variant: "destructive",
      });
    }
  }, [session.error]);

  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      // Ensure session is properly ended when component unmounts
      endSession();
    };
  }, [endSession]);

  // Show API key missing error if needed
  if (!apiKey) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-md flex flex-col justify-center items-center z-50">
        <div className="absolute top-4 right-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        <div className="flex flex-col items-center justify-center gap-6 text-center p-6">
          <h2 className="text-xl font-semibold text-white">OpenAI API Key Required</h2>
          <p className="text-white/80">
            Voice mode requires an OpenAI API key to work.
            <br />Please add your API key in Settings.
          </p>
          <Button 
            onClick={onClose} 
            className="mt-4 bg-white text-black hover:bg-white/90"
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

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
          onClick={!session.isConnected && !session.isConnecting ? handleRetry : undefined} 
        />
        
        <VoiceStatus 
          session={session}
          connectionAttempts={connectionAttempts}
          maxAttempts={maxAttempts}
          onRetry={handleRetry}
        />
      </div>
    </div>
  );
};

export default VoiceMode;
