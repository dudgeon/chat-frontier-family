
import React, { createContext, useContext } from 'react';
import { Message } from '@/types/chat';
import { ChatContextType } from '@/types/chatContext';
import { useApiKey } from '@/hooks/useApiKey';
import { useMessageHandler } from '@/hooks/useMessageHandler';
import { useHeroColor } from '@/hooks/useHeroColor';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useChatNameGenerator } from '@/hooks/useChatNameGenerator';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { apiKey, setApiKey } = useApiKey();
  const { heroColor, setHeroColor } = useHeroColor();
  
  const { 
    chatSessions, 
    activeChatId, 
    activeSession, 
    createNewChat: createNewChatSession,
    switchToChat: switchToChatSession,
    updateChatName,
    updateSessionMessages
  } = useChatSessions();

  // Message handler for the active chat
  const { 
    messages, 
    setMessages, 
    isWaitingForResponse, 
    addMessage: handleMessage 
  } = useMessageHandler(activeSession.messages);

  // Set up chat name generation
  useChatNameGenerator(
    messages, 
    activeSession.name, 
    activeChatId, 
    updateChatName
  );

  // Store the updated message list in the chat sessions
  React.useEffect(() => {
    if (activeChatId && messages.length > 0) {
      updateSessionMessages(messages);
    }
  }, [messages, activeChatId]);

  // Create a new chat
  const createNewChat = () => {
    const initialMessages = createNewChatSession();
    setMessages(initialMessages);
  };

  // Switch to a chat
  const switchToChat = (id: string) => {
    const chatMessages = switchToChatSession(id);
    setMessages(chatMessages);
  };

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
      chatName: activeSession.name,
      chatSessions,
      activeChatId,
      createNewChat,
      switchToChat,
      updateChatName
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
