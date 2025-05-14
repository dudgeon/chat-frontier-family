
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Message } from '@/types/chat';
import { useApiKey } from '@/hooks/useApiKey';
import { useMessageHandler } from '@/hooks/useMessageHandler';
import { updateCssVariable } from '@/utils/colorUtils';
import { generateChatName } from '@/utils/chatNameGenerator';

interface ChatContextType {
  messages: Message[];
  addMessage: (content: string, isUser: boolean) => void;
  heroColor: string;
  setHeroColor: (color: string) => void;
  isWaitingForResponse: boolean;
  apiKey: string;
  setApiKey: (key: string) => void;
  chatName: string | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { apiKey, setApiKey } = useApiKey();
  const initialMessages = [
    { content: "Hello! I'm powered by GPT-4o. How can I help you today?", isUser: false }
  ];
  const { messages, setMessages, isWaitingForResponse, addMessage: handleMessage } = useMessageHandler(initialMessages);
  const [heroColor, setHeroColor] = useState<string>('#6366F1');
  const [chatName, setChatName] = useState<string | null>(null);

  // Generate a chat name after the third reply
  useEffect(() => {
    const assistantMessages = messages.filter(m => !m.isUser);
    
    // Only generate name after third assistant reply and if we don't already have a name
    if (assistantMessages.length === 3 && !chatName) {
      generateChatName(messages).then(name => setChatName(name));
    }
  }, [messages, chatName]);

  // Update CSS variable when hero color changes
  useEffect(() => {
    updateCssVariable(heroColor);
  }, [heroColor]);

  // Wrapper for adding messages to maintain the same interface
  const addMessage = (content: string, isUser: boolean) => {
    handleMessage(content, isUser, apiKey);
  };

  return (
    <ChatContext.Provider value={{ 
      messages, 
      addMessage, 
      heroColor, 
      setHeroColor, 
      isWaitingForResponse,
      apiKey,
      setApiKey,
      chatName
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
