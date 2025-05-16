
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

export const useVoicePermissions = (
  startSession: () => Promise<void>,
  isConnected: boolean,
  isConnecting: boolean,
  hasError: boolean,
  maxAttempts: number = 3
) => {
  const [permissionStatus, setPermissionStatus] = useState<string>('checking');
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // Helper function to check microphone permission
  const checkMicrophonePermission = async (): Promise<boolean> => {
    try {
      console.log('Checking microphone permissions');
      
      // Request audio permissions with specific constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Verify we have at least one audio track
      if (stream.getAudioTracks().length === 0) {
        console.error('No audio tracks available');
        return false;
      }
      
      // Check track settings
      const track = stream.getAudioTracks()[0];
      console.log('Audio track enabled:', track.enabled);
      console.log('Audio track settings:', track.getSettings());
      
      // Stop the tracks immediately, we just needed to check permission
      stream.getTracks().forEach(track => track.stop());
      
      console.log('Microphone permission granted');
      return true;
    } catch (error) {
      console.error('Microphone permission error:', error);
      return false;
    }
  };

  // Initial permission check and session start
  const initSession = async () => {
    try {
      // Check for microphone permissions first
      const hasPermission = await checkMicrophonePermission();
      if (hasPermission) {
        setPermissionStatus('granted');
        setConnectionAttempts(prev => prev + 1);
        
        // Add slight delay before starting session to ensure permissions are properly registered
        await new Promise(resolve => setTimeout(resolve, 500));
        await startSession();
      } else {
        setPermissionStatus('denied');
        toast({
          title: "Microphone Access Required",
          description: "Please allow microphone access in your browser settings to use voice mode",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error initializing session:', error);
      setPermissionStatus('error');
      toast({
        title: "Voice Mode Error",
        description: error instanceof Error ? error.message : "Failed to initialize voice mode",
        variant: "destructive",
      });
    }
  };

  // Handle retry
  const handleRetry = async () => {
    try {
      setConnectionAttempts(prev => prev + 1);
      
      if (permissionStatus === 'granted') {
        await startSession();
        toast({
          title: "Reconnecting",
          description: "Attempting to reconnect to voice service...",
        });
      } else {
        const hasPermission = await checkMicrophonePermission();
        if (hasPermission) {
          setPermissionStatus('granted');
          await startSession();
        } else {
          toast({
            title: "Permission Required",
            description: "Please allow microphone access in your browser settings",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error retrying session:', error);
      toast({
        title: "Reconnection Failed",
        description: error instanceof Error ? error.message : "Failed to reconnect",
        variant: "destructive",
      });
    }
  };

  // Auto-retry if needed
  useEffect(() => {
    if (permissionStatus === 'granted' && !isConnected && !isConnecting && connectionAttempts < maxAttempts && !hasError) {
      const retryTimer = setTimeout(() => {
        console.log(`Auto-retrying connection (attempt ${connectionAttempts + 1}/${maxAttempts})`);
        startSession();
        setConnectionAttempts(prev => prev + 1);
      }, 3000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [isConnected, isConnecting, hasError, connectionAttempts, permissionStatus, maxAttempts, startSession]);

  return {
    permissionStatus,
    connectionAttempts,
    maxAttempts,
    handleRetry,
    initSession,
    checkMicrophonePermission
  };
};
