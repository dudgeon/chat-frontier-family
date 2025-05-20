
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Message } from '@/types/chat';
import { ChatContextType } from '@/types/chatContext';
import { useMessageHandler } from '@/hooks/useMessageHandler';
import { useHeroColor } from '@/hooks/useHeroColor';
import { useChatSessions } from '@/hooks/chatSessions';
import { useChatNameGenerator } from '@/hooks/useChatNameGenerator';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { getSupabase } from '@/lib/supa';
import {
  DEFAULT_ADULT_SYSTEM_MESSAGE,
  getDefaultSystemMessage
} from '@/config/systemMessages';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { heroColor, setHeroColor } = useHeroColor();
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [systemMessage, setSystemMessage] = useState(
    DEFAULT_ADULT_SYSTEM_MESSAGE
  );

  useEffect(() => {
    const fetchSystemMessage = async () => {
      if (!user) return;

      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('profiles')
        .select('system_message, user_role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching system message:', error);
        return;
      }

      if (data) {
        if (data.system_message) {
          setSystemMessage(data.system_message);
        } else {
          setSystemMessage(
            getDefaultSystemMessage(
              (data.user_role === 'child' ? 'child' : 'adult') as 'child' | 'adult'
            )
          );
        }
      }
    };

    fetchSystemMessage();
  }, [user]);
  
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
    addMessage: handleMessage
  } = useMessageHandler(initialMessages, systemMessage);

  // Track the previously active chat ID to detect chat switches
  const prevChatIdRef = useRef<string | null>(null);

  // Set messages when the active session first loads or when switching chats
  useEffect(() => {
    if (!activeSession || !activeSession.messages) return;

    // Only override messages on initial load or when switching chat sessions
    if (!isInitialized || prevChatIdRef.current !== activeSession.id) {
      setMessages(activeSession.messages);
      prevChatIdRef.current = activeSession.id;

      if (!isInitialized) {
        setIsInitialized(true);
      }
    }
  }, [activeSession, setMessages, isInitialized]);

  // Reset messages when user signs out
  useEffect(() => {
    if (!user) {
      setMessages([]);
    }
  }, [user, setMessages]);

  // Set up chat name generation
  useChatNameGenerator(
    messages,
    activeSession.name,
    activeChatId,
    updateChatName,
    isWaitingForResponse
  );

  // Store the updated message list in the chat sessions
  useEffect(() => {
    if (
      activeChatId &&
      messages.length > 0 &&
      isInitialized &&
      !isWaitingForResponse
    ) {
      updateSessionMessages(messages);
    }
  }, [
    messages,
    activeChatId,
    isInitialized,
    isWaitingForResponse,
    updateSessionMessages,
  ]);

  // Create a new chat - use useCallback to prevent recreation on every render
  const createNewChat = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a new chat.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      console.log("ChatContext: Creating new chat session...");
      const initialMessages = await createNewChatSession();
      console.log("ChatContext: New chat session created with messages:", initialMessages);
      
      if (initialMessages) {
        // Reset messages to the initial state of the new chat
        setMessages(initialMessages);
        
        // Force a UI update with a toast notification
        toast({
          title: "New chat created",
          description: "Started a new conversation"
        });
      } else {
        throw new Error("No initial messages returned from createNewChatSession");
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
      toast({
        title: "Error",
        description: "Could not create a new chat. Please try again.",
        variant: "destructive"
      });
    }
  }, [user, createNewChatSession, setMessages]);

  // Switch to a chat - use useCallback to prevent recreation on every render
  const switchToChat = useCallback((id: string) => {
    const chatMessages = switchToChatSession(id);
    setMessages(chatMessages);
  }, [switchToChatSession, setMessages]);

  // Wrapper for adding messages to maintain the same interface
  const addMessage = useCallback((content: string, isUser: boolean) => {
    if (!user && isUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to send messages.",
        variant: "destructive"
      });
      return;
    }
    
    handleMessage(content, isUser);
  }, [user, handleMessage]);

  // Delete a message from the chat
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to delete messages.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check if user has adult role
      const supabase = await getSupabase();
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_role, system_message')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw new Error(profileError.message);
      }

      if (profileData.user_role !== 'adult') {
        toast({
          title: "Permission denied",
          description: "You don't have permission to delete messages.",
          variant: "destructive"
        });
        return;
      }

      // Delete from database
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        throw new Error(error.message);
      }

      // Delete from local state
      const updatedMessages = messages.filter(msg => msg.id !== messageId);
      setMessages(updatedMessages);
      
      // Update session with new messages
      if (activeChatId) {
        updateSessionMessages(updatedMessages);
      }

      toast({
        title: "Message deleted",
        description: "The message has been removed from the chat history."
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Could not delete the message. Please try again.",
        variant: "destructive"
      });
    }
  }, [user, messages, activeChatId, setMessages, updateSessionMessages]);

  return (
    <ChatContext.Provider value={{ 
      messages, 
      addMessage,
      deleteMessage,
      heroColor,
      setHeroColor,
      isWaitingForResponse,
      systemMessage,
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
