import { useRef, useEffect } from 'react';

export const useAudioRecorder = (
  wsRef: React.MutableRefObject<WebSocket | null>,
  sessionActiveRef: React.MutableRefObject<boolean>,
  onError: (error: string) => void
) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  const initializeAudio = async () => {
    try {
      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;
      await audioContext.audioWorklet.addModule('/audio-capture-worklet.js');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      sourceRef.current = audioContext.createMediaStreamSource(stream);
      workletRef.current = new AudioWorkletNode(audioContext, 'capture-processor');

      workletRef.current.port.onmessage = (e) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && sessionActiveRef.current) {
          const chunk = e.data as ArrayBuffer;
          wsRef.current.send(chunk);
        }
      };

      sourceRef.current.connect(workletRef.current);
    } catch (error) {
      console.error('Error initializing audio recorder:', error);
      onError(error instanceof Error ? error.message : 'Failed to initialize audio');
      cleanupAudio();
    }
  };

  const cleanupAudio = () => {
    try {
      sourceRef.current?.disconnect();
      workletRef.current?.disconnect();
      // stop all tracks
      const stream = sourceRef.current?.mediaStream;
      stream?.getTracks().forEach((t) => t.stop());
    } catch {}
    sourceRef.current = null;
    workletRef.current = null;

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  return {
    audioContextRef,
    initializeAudio,
    cleanupAudio
  };
};
