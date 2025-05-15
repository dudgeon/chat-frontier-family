
/**
 * Sends session configuration update to the server
 * @param ws - WebSocket connection
 */
export const sendSessionUpdate = (ws: WebSocket | null) => {
  // Ensure WebSocket is open before sending
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.error('Cannot send session update: WebSocket not open');
    return;
  }

  // Prepare session update configuration
  const sessionUpdateEvent = {
    type: "session.update",
    session: {
      // Enable both text and audio modalities
      modalities: ["text", "audio"],
      // Instructions for the AI assistant
      instructions: "You are a helpful, friendly assistant. Keep your responses brief and conversational. You're speaking, not writing.",
      // Voice selection for the AI
      voice: "alloy",
      // Audio format settings
      input_audio_format: "pcm16",
      output_audio_format: "pcm16",
      input_audio_transcription: {
        model: "whisper-1"
      },
      // Server-side voice activity detection settings
      turn_detection: {
        type: "server_vad",
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 2000  // Increased from 1000 to 2000 for better turn handling
      }
    }
  };

  // Send configuration to the server
  console.log('Sending session update to configure voice settings');
  ws.send(JSON.stringify(sessionUpdateEvent));
};
