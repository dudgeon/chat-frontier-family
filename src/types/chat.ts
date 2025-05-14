export interface Message {
  id?: string;
  content: string;
  isUser: boolean;
  timestamp?: number;
  role?: 'user' | 'assistant' | 'system';
}

export interface ChatSession {
  id: string;
  name: string | null;
  messages: Message[];
  lastUpdated: number | null;
}
