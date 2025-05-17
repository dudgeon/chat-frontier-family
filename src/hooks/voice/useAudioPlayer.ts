import { useRef, useEffect } from 'react';

export const useAudioPlayer = () => {
  const contextRef = useRef<AudioContext | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const init = async () => {
    const ctx = new AudioContext({ sampleRate: 24000 });
    contextRef.current = ctx;
    await ctx.audioWorklet.addModule('/audio-playback-worklet.js');
    workletRef.current = new AudioWorkletNode(ctx, 'playback-processor');
    workletRef.current.connect(ctx.destination);
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  };

  const playChunk = (chunk: ArrayBuffer) => {
    if (workletRef.current) {
      workletRef.current.port.postMessage(chunk, [chunk]);
    }
  };

  const cleanup = () => {
    workletRef.current?.disconnect();
    workletRef.current = null;
    if (contextRef.current) {
      contextRef.current.close().catch(() => {});
      contextRef.current = null;
    }
  };

  return { init, playChunk, cleanup };
};
