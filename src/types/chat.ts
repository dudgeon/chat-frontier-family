
export interface Message {
  content: string;
  isUser: boolean;
  timestamp?: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}
