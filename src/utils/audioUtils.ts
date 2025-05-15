
/**
 * Utility functions for audio recording and encoding
 */

export interface AudioRecorder {
  stream: MediaStream | null;
  audioContext: AudioContext | null;
  processor: ScriptProcessorNode | null;
  source: MediaStreamAudioSourceNode | null;
  stop: () => void;
}

/**
 * Initializes audio recording with microphone
 * @param onAudioData Callback function that receives audio data
 * @returns AudioRecorder object with stop method
 */
export const initializeRecorder = (onAudioData: (data: Float32Array) => void): AudioRecorder => {
  let stream: MediaStream | null = null;
  let audioContext: AudioContext | null = null;
  let processor: ScriptProcessorNode | null = null;
  let source: MediaStreamAudioSourceNode | null = null;

  const startRecording = async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      audioContext = new AudioContext({
        sampleRate: 24000,
      });
      
      source = audioContext.createMediaStreamSource(stream);
      processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        onAudioData(new Float32Array(inputData));
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  };

  // Start recording immediately
  startRecording();
  
  // Return recorder with stop method
  return {
    stream,
    audioContext,
    processor,
    source,
    stop: () => {
      if (source) source.disconnect();
      if (processor) processor.disconnect();
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (audioContext) audioContext.close();
    }
  };
};

/**
 * Encodes Float32Array audio data to base64 string for transmission
 * @param float32Array Raw audio data
 * @returns Base64 encoded string
 */
export const encodeAudioData = (float32Array: Float32Array): string => {
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
