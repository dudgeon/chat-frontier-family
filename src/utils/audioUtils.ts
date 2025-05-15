
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
  let isActive = true;

  const startRecording = async () => {
    try {
      console.log('Requesting microphone access with specific constraints');
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log('Creating audio context with sample rate 24000Hz');
      audioContext = new AudioContext({
        sampleRate: 24000,
      });
      
      // Log actual sample rate (might differ from requested)
      console.log('Actual audio context sample rate:', audioContext.sampleRate);
      
      source = audioContext.createMediaStreamSource(stream);
      
      // Create processor with appropriate buffer size for real-time processing
      // Use larger buffer size for more stable processing
      processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      let consecutiveZeros = 0;
      const maxConsecutiveZeros = 5; // Number of silent buffers before logging warning
      
      processor.onaudioprocess = (e) => {
        if (!isActive) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Simple silence detection for debugging
        const isAllZeros = inputData.every(val => Math.abs(val) < 0.001);
        if (isAllZeros) {
          consecutiveZeros++;
          if (consecutiveZeros >= maxConsecutiveZeros) {
            console.warn('Possible audio input issue: multiple silent buffers detected');
            consecutiveZeros = 0; // Reset counter to avoid log spam
          }
        } else {
          consecutiveZeros = 0; // Reset counter when audio is detected
        }
        
        // Send the audio data even if it's silence - the server handles VAD
        onAudioData(new Float32Array(inputData));
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      console.log('Audio recording successfully initialized');
      
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
      isActive = false;
      console.log('Stopping audio recorder');
      
      if (source) {
        try {
          source.disconnect();
        } catch (e) {
          console.warn('Error disconnecting source:', e);
        }
      }
      
      if (processor) {
        try {
          processor.disconnect();
        } catch (e) {
          console.warn('Error disconnecting processor:', e);
        }
      }
      
      if (stream) {
        try {
          stream.getTracks().forEach(track => {
            console.log('Stopping audio track:', track.kind, track.label);
            track.stop();
          });
        } catch (e) {
          console.warn('Error stopping media tracks:', e);
        }
      }
      
      if (audioContext) {
        try {
          audioContext.close();
        } catch (e) {
          console.warn('Error closing audio context:', e);
        }
      }
    }
  };
};

/**
 * Encodes Float32Array audio data to base64 string for transmission
 * @param float32Array Raw audio data
 * @returns Base64 encoded string
 */
export const encodeAudioData = (float32Array: Float32Array): string => {
  try {
    const int16Array = new Int16Array(float32Array.length);
    
    // Convert float32 (-1.0 to 1.0) to int16 (-32768 to 32767)
    for (let i = 0; i < float32Array.length; i++) {
      // Clamp values to valid range
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      // Convert to int16 range (negative values to negative range, positive to positive)
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    const chunkSize = 0x8000; // Split into chunks to avoid call stack size exceeded
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  } catch (e) {
    console.error('Error encoding audio data:', e);
    // Return empty string on error rather than crashing
    return '';
  }
};
