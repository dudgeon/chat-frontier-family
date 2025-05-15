
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Message } from '@/types/chat';
import { ChatContextType } from '@/types/chatContext';
import { useApiKey } from '@/hooks/useApiKey';
import { useMessageHandler } from '@/hooks/useMessageHandler';
import { useHeroColor } from '@/hooks/useHeroColor';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useChatNameGenerator } from '@/hooks/useChatNameGenerator';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { apiKey, setApiKey } = useApiKey();
  const { heroColor, setHeroColor } = useHeroColor();
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { 
    chatSessions, 
    activeChatId, 
    activeSession, 
    isLoading,
    createNewChat: createNewChatSession,
    switchToChat: switchToChatSession,
    updateChatName,
    updateSessionMessages
  } = useChatSessions();

  // Initialize with empty messages until sessions are loaded
  const initialMessages = activeSession?.messages || [];
  
  // Message handler for the active chat
  const { 
    messages, 
    setMessages, 
    isWaitingForResponse, 
    addMessage: handleMessage,
    deleteMessage: handleDeleteMessage
  } = useMessageHandler(initialMessages);

  // Set messages when active session changes or loads
  useEffect(() => {
    if (activeSession && activeSession.messages) {
      setMessages(activeSession.messages);
      setIsInitialized(true);
    }
  }, [activeSession, setMessages]);

  // Set up chat name generation
  useChatNameGenerator(
    messages, 
    activeSession.name, 
    activeChatId, 
    updateChatName
  );

  // Store the updated message list in the chat sessions
  useEffect(() => {
    if (activeChatId && messages.length > 0 && isInitialized) {
      updateSessionMessages(messages);
    }
  }, [messages, activeChatId, isInitialized]);

  // Create a new chat
  const createNewChat = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a new chat.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const initialMessages = await createNewChatSession();
      setMessages(initialMessages);
    } catch (error) {
      console.error('Error creating new chat:', error);
      toast({
        title: "Error",
        description: "Could not create a new chat. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Switch to a chat
  const switchToChat = (id: string) => {
    const chatMessages = switchToChatSession(id);
    setMessages(chatMessages);
  };

  // Wrapper for adding messages to maintain the same interface
  const addMessage = (content: string, isUser: boolean) => {
    if (!user && isUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to send messages.",
        variant: "destructive"
      });
      return;
    }
    
    handleMessage(content, isUser, apiKey);
  };

  // Delete message wrapper 
  const deleteMessage = async (messageId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to delete messages.",
        variant: "destructive"
      });
      return;
    }

    await handleDeleteMessage(messageId);
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
      updateChatName,
      deleteMessage
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
