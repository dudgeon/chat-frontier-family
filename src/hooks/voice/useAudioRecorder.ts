
import { useRef, useEffect } from 'react';
import { initializeRecorder, type AudioRecorder } from '@/utils/audioUtils';
import { encodeAudioData } from '@/utils/audioUtils';
import { toast } from '@/components/ui/use-toast';

/**
 * Custom hook for managing audio recording in voice sessions
 * @param wsRef WebSocket reference
 * @param sessionActiveRef Reference to track if session is active
 * @param onError Callback for error handling
 * @returns Object containing audio context reference and functions
 */
export const useAudioRecorder = (
  wsRef: React.MutableRefObject<WebSocket | null>,
  sessionActiveRef: React.MutableRefObject<boolean>,
  onError: (error: string) => void
) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);

  // Clean up audio resources when component unmounts
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  /**
   * Initializes the audio recorder
   */
  const initializeAudio = async () => {
    try {
      // Initialize audio context with specific sample rate
      try {
        const audioContext = new AudioContext({
          sampleRate: 24000,
        });
        audioContextRef.current = audioContext;
        console.log('Audio context initialized with sample rate 24000Hz');
      } catch (e) {
        console.error('Failed to initialize audio context:', e);
        throw new Error('Could not access audio system. Please check your browser permissions.');
      }
      
      /**
       * Callback to handle audio data from the recorder
       * @param audioData - Float32Array containing audio samples
       */
      const handleAudioData = (audioData: Float32Array) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && sessionActiveRef.current) {
          try {
            // Encode audio data to base64 format
            const encodedAudio = encodeAudioData(audioData);
            
            // Send audio data to server
            wsRef.current.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: encodedAudio
            }));
          } catch (e) {
            console.error('Error sending audio data:', e);
          }
        }
      };
      
      // Initialize audio recorder with retry mechanism
      try {
        console.log('Initializing audio recorder');
        recorderRef.current = initializeRecorder(handleAudioData);
        
        // Set a timeout to check if we're actually getting audio
        setTimeout(() => {
          if (sessionActiveRef.current && !recorderRef.current) {
            console.log('Voice session started but no audio detected yet');
            toast({
              title: "Microphone Check",
              description: "Please say something to test your microphone",
            });
          }
        }, 5000);
      } catch (error) {
        console.error('Error initializing audio recorder:', error);
        throw new Error('Failed to access microphone. Please check your permissions.');
      }
      
    } catch (error) {
      console.error('Error initializing audio:', error);
      onError(error instanceof Error ? error.message : 'Unknown error initializing audio');
      cleanupAudio();
    }
  };

  /**
   * Cleans up audio recorder resources
   */
  const cleanupAudio = () => {
    // Stop recording if active
    if (recorderRef.current) {
      console.log('Stopping recorder');
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    
    // Close audio context if open
    if (audioContextRef.current) {
      console.log('Closing audio context');
      audioContextRef.current.close().catch(err => {
        console.warn('Error closing audio context:', err);
      });
      audioContextRef.current = null;
    }
  };

  return {
    audioContextRef,
    recorderRef,
    initializeAudio,
    cleanupAudio
  };
};
