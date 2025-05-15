
import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceModeProps {
  onClose: () => void;
}

interface VoiceSession {
  isConnecting: boolean;
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
}

const VoiceMode: React.FC<VoiceModeProps> = ({ onClose }) => {
  const [session, setSession] = useState<VoiceSession>({
    isConnecting: false,
    isConnected: false,
    isListening: false,
    isSpeaking: false,
    transcript: '',
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recorderRef = useRef<any>(null);

  const startSession = async () => {
    try {
      setSession(prev => ({ ...prev, isConnecting: true }));

      // Get token from Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('realtime-token');
      
      if (error) {
        throw new Error(`Failed to get token: ${error.message}`);
      }

      // Initialize WebSocket with the correct project ID
      // The project ID is hardcoded here because it's available in the Supabase client configuration
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
      initializeRecorder();
      
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

  const initializeRecorder = () => {
    if (!audioContextRef.current) return;
    
    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 24000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        const source = audioContextRef.current!.createMediaStreamSource(stream);
        const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
        
        processor.onaudioprocess = (e) => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const inputData = e.inputBuffer.getChannelData(0);
            const audioData = encodeAudioData(new Float32Array(inputData));
            
            // Send audio data to server
            wsRef.current.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: audioData
            }));
          }
        };
        
        source.connect(processor);
        processor.connect(audioContextRef.current!.destination);
        
        recorderRef.current = {
          stream,
          source,
          processor,
          stop: () => {
            if (source) source.disconnect();
            if (processor) processor.disconnect();
            if (stream) stream.getTracks().forEach(track => track.stop());
          }
        };
        
      } catch (error) {
        console.error('Error accessing microphone:', error);
        toast({
          title: 'Microphone Error',
          description: 'Failed to access your microphone',
          variant: 'destructive',
        });
      }
    };
    
    startRecording();
  };

  const encodeAudioData = (float32Array: Float32Array): string => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    const chunkSize = 0x8000;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
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

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (recorderRef.current) recorderRef.current.stop();
      if (audioContextRef.current) audioContextRef.current.close();
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

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
        <div 
          className={`relative w-40 h-40 rounded-full flex items-center justify-center cursor-pointer
            ${session.isConnecting ? 'bg-gray-600' : ''}
            ${session.isConnected && !session.isListening && !session.isSpeaking ? 'bg-hero/80 hover:bg-hero' : ''}
            ${session.isListening ? 'bg-red-500 animate-pulse' : ''}
            ${session.isSpeaking ? 'bg-green-500' : ''}
          `}
          onClick={!session.isConnected && !session.isConnecting ? startSession : undefined}
        >
          {session.isConnecting ? (
            <Loader2 className="h-16 w-16 text-white animate-spin" />
          ) : (
            <Mic className="h-16 w-16 text-white" />
          )}
        </div>
        
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
