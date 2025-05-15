
/**
 * Types for voice chat session functionality
 */

/**
 * Interface for tracking the state of a voice session
 * @property isConnecting - Whether the connection is being established
 * @property isConnected - Whether the WebSocket connection is established
 * @property isListening - Whether the AI is currently listening (user speaking)
 * @property isSpeaking - Whether the AI is currently speaking
 * @property transcript - The current transcript of the AI's response
 */
export interface VoiceSessionState {
  isConnecting: boolean;
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
}

/**
 * Interface for WebSocket server events
 */
export interface ServerEvent {
  type: string;
  delta?: string;
  [key: string]: any;
}
