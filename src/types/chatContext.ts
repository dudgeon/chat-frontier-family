
import { Message } from './chat';

export interface ChatSession {
  id: string;
  name: string | null;
  messages: Message[];
  lastUpdated: number | null;
}

export interface ChatContextType {
  messages: Message[];
  addMessage: (content: string, isUser: boolean) => void;
  deleteMessage: (messageId: string) => void;
  heroColor: string;
  setHeroColor: (color: string) => void;
  isWaitingForResponse: boolean;
  systemMessage: string;
  chatName: string | null;
  chatSessions: ChatSession[];
  activeChatId: string;
  createNewChat: () => void;
  switchToChat: (id: string) => void;
  updateChatName: (id: string, newName: string) => void;
}

// Local storage keys
export const COLOR_STORAGE_KEY = 'chat-app-color';
export const SESSIONS_STORAGE_KEY = 'chat-app-sessions';
export const ACTIVE_SESSION_KEY = 'chat-app-active-session';

// Helper function to generate a unique ID
export const generateId = () => Math.random().toString(36).substring(2, 15);
