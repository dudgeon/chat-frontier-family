
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { initializeRecorder, encodeAudioData, type AudioRecorder } from '@/utils/audioUtils';

export interface VoiceSessionState {
  isConnecting: boolean;
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
}

export const useVoiceSession = (onClose: () => void) => {
  const [session, setSession] = useState<VoiceSessionState>({
    isConnecting: false,
    isConnected: false,
    isListening: false,
    isSpeaking: false,
    transcript: '',
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (recorderRef.current) recorderRef.current.stop();
      if (audioContextRef.current) audioContextRef.current.close();
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const handleServerEvent = (event: any) => {
    if (event.type === 'session.created') {
      // Session created, send configuration
      sendSessionUpdate();
    } else if (event.type === 'session.updated') {
      console.log('Session updated:', event);
      // Start listening for voice input
      setSession(prev => ({ ...prev, isListening: true }));
    } else if (event.type === 'input_audio_buffer.speech_started') {
      setSession(prev => ({ ...prev, isListening: true }));
    } else if (event.type === 'input_audio_buffer.speech_stopped') {
      setSession(prev => ({ ...prev, isListening: false }));
    } else if (event.type === 'response.audio_transcript.delta') {
      setSession(prev => ({ 
        ...prev, 
        isSpeaking: true,
        transcript: prev.transcript + (event.delta || '') 
      }));
    } else if (event.type === 'response.audio.done') {
      setSession(prev => ({ ...prev, isSpeaking: false }));
    }
  };

  const sendSessionUpdate = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const sessionUpdateEvent = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: "You are a helpful, friendly assistant. Keep your responses brief and conversational. You're speaking, not writing.",
        voice: "alloy",
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 1000
        }
      }
    };

    wsRef.current.send(JSON.stringify(sessionUpdateEvent));
    console.log('Sent session update event');
  };

  const startSession = async () => {
    try {
      setSession(prev => ({ ...prev, isConnecting: true }));

      // Get token from Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('realtime-token');
      
      if (error) {
        throw new Error(`Failed to get token: ${error.message}`);
      }

      // Initialize WebSocket with the correct project ID
      const wsUrl = `wss://xrrauvcciuiaztzajmeq.functions.supabase.co/realtime-chat`;
      console.log('Connecting to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connection opened');
        setSession(prev => ({ ...prev, isConnected: true, isConnecting: false }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);
          
          handleServerEvent(data);
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        toast({
          title: 'Connection Error',
          description: 'Failed to establish voice connection',
          variant: 'destructive',
        });
        setSession(prev => ({ ...prev, isConnecting: false }));
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setSession({
          isConnecting: false,
          isConnected: false,
          isListening: false,
          isSpeaking: false,
          transcript: '',
        });
      };

      // Initialize audio context
      const audioContext = new AudioContext({
        sampleRate: 24000,
      });
      audioContextRef.current = audioContext;
      
      // Start recorder when connection is established
      const handleAudioData = (audioData: Float32Array) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const encodedAudio = encodeAudioData(audioData);
          
          // Send audio data to server
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: encodedAudio
          }));
        }
      };
      
      recorderRef.current = initializeRecorder(handleAudioData);
      
    } catch (error) {
      console.error('Error starting voice session:', error);
      toast({
        title: 'Connection Error',
        description: error instanceof Error ? error.message : 'Failed to start voice session',
        variant: 'destructive',
      });
      setSession(prev => ({ ...prev, isConnecting: false }));
    }
  };

  const endSession = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    onClose();
  };

  return {
    session,
    startSession,
    endSession
  };
};
