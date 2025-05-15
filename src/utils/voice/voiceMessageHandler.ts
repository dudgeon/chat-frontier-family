
import { ServerEvent, VoiceSessionState } from '@/types/voiceSession';

/**
 * Handler for WebSocket server events
 * @param event - Event object received from the server
 * @param setSession - Function to update the voice session state
 */
export const handleServerEvent = (event: ServerEvent, setSession: (updater: (prev: VoiceSessionState) => VoiceSessionState) => void) => {
  if (event.type === 'session.created') {
    // Session created by server, log the event
    console.log('Session created:', event);
  } else if (event.type === 'session.updated') {
    console.log('Session updated:', event);
    // Start listening for voice input after session config is acknowledged
    setSession(prev => ({ ...prev, isListening: true }));
  } else if (event.type === 'input_audio_buffer.speech_started') {
    // User started speaking
    console.log('User speech detected');
    setSession(prev => ({ ...prev, isListening: true }));
  } else if (event.type === 'input_audio_buffer.speech_stopped') {
    // User stopped speaking
    console.log('User stopped speaking');
    setSession(prev => ({ ...prev, isListening: false }));
  } else if (event.type === 'response.audio_transcript.delta') {
    // Received partial transcript from AI response
    setSession(prev => ({ 
      ...prev, 
      isSpeaking: true,
      transcript: prev.transcript + (event.delta || '') 
    }));
  } else if (event.type === 'response.audio.done') {
    // AI finished speaking
    console.log('AI finished speaking, ready for next input');
    setSession(prev => ({ ...prev, isSpeaking: false, isListening: true }));
  } else if (event.type === 'error') {
    // Handle explicit error messages
    console.error('Server sent error:', event);
    setSession(prev => ({ 
      ...prev, 
      error: event.message || 'Server error' 
    }));
  }
};
