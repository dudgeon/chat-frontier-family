
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Message } from '@/types/chat';
import { useApiKey } from '@/hooks/useApiKey';
import { useMessageHandler } from '@/hooks/useMessageHandler';
import { updateCssVariable } from '@/utils/colorUtils';
import { generateChatName } from '@/utils/chatNameGenerator';

interface ChatSession {
  id: string;
  name: string | null;
  messages: Message[];
  lastUpdated: number | null;
}

interface ChatContextType {
  messages: Message[];
  addMessage: (content: string, isUser: boolean) => void;
  heroColor: string;
  setHeroColor: (color: string) => void;
  isWaitingForResponse: boolean;
  apiKey: string;
  setApiKey: (key: string) => void;
  chatName: string | null;
  chatSessions: ChatSession[];
  activeChatId: string;
  createNewChat: () => void;
  switchToChat: (id: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Helper function to generate a unique ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Local storage keys
const COLOR_STORAGE_KEY = 'chat-app-color';
const SESSIONS_STORAGE_KEY = 'chat-app-sessions';
const ACTIVE_SESSION_KEY = 'chat-app-active-session';

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { apiKey, setApiKey } = useApiKey();
  
  // Get stored color or use default
  const [heroColor, setHeroColorState] = useState<string>(() => {
    const storedColor = localStorage.getItem(COLOR_STORAGE_KEY);
    return storedColor || '#6366F1';
  });

  // Store sessions and active session ID
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    try {
      const storedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
      return storedSessions ? JSON.parse(storedSessions) : [];
    } catch (e) {
      console.error('Failed to parse stored sessions:', e);
      return [];
    }
  });
  
  const [activeChatId, setActiveChatId] = useState<string>(() => {
    const storedActiveId = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (storedActiveId && chatSessions.some(s => s.id === storedActiveId)) {
      return storedActiveId;
    }
    
    // If no active chat or the ID doesn't exist, return the first session or create one
    if (chatSessions.length > 0) {
      return chatSessions[0].id;
    }
    
    // Create a new session if none exists
    const newId = generateId();
    setChatSessions([{
      id: newId,
      name: null,
      messages: [{
        content: "Hello! I'm powered by GPT-4o. How can I help you today?",
        isUser: false,
        timestamp: Date.now()
      }],
      lastUpdated: Date.now()
    }]);
    return newId;
  });

  // Find the active chat session
  const activeSession = chatSessions.find(s => s.id === activeChatId) || {
    id: activeChatId,
    name: null,
    messages: [],
    lastUpdated: null
  };

  // Message handler for the active chat
  const { 
    messages, 
    setMessages, 
    isWaitingForResponse, 
    addMessage: handleMessage 
  } = useMessageHandler(activeSession.messages);

  // Create a new chat session
  const createNewChat = () => {
    const newId = generateId();
    const newSession = {
      id: newId,
      name: null,
      messages: [{
        content: "Hello! I'm powered by GPT-4o. How can I help you today?",
        isUser: false,
        timestamp: Date.now()
      }],
      lastUpdated: Date.now()
    };
    
    setChatSessions(prev => [newSession, ...prev]);
    setActiveChatId(newId);
    setMessages(newSession.messages);
  };

  // Switch to an existing chat
  const switchToChat = (id: string) => {
    const session = chatSessions.find(s => s.id === id);
    if (session) {
      setActiveChatId(id);
      setMessages(session.messages);
    }
  };

  // Update CSS variable when hero color changes
  useEffect(() => {
    updateCssVariable(heroColor);
    localStorage.setItem(COLOR_STORAGE_KEY, heroColor);
  }, [heroColor]);

  // Store the updated message list in the chat sessions
  useEffect(() => {
    if (activeChatId && messages.length > 0) {
      setChatSessions(prev => 
        prev.map(session => 
          session.id === activeChatId
            ? { ...session, messages, lastUpdated: Date.now() }
            : session
        )
      );
    }
  }, [messages, activeChatId]);

  // Store chat sessions in local storage
  useEffect(() => {
    if (chatSessions.length > 0) {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(chatSessions));
    }
  }, [chatSessions]);

  // Store active chat ID in local storage
  useEffect(() => {
    localStorage.setItem(ACTIVE_SESSION_KEY, activeChatId);
  }, [activeChatId]);

  // Generate a chat name after the third reply
  useEffect(() => {
    const assistantMessages = messages.filter(m => !m.isUser);
    const currentSession = chatSessions.find(s => s.id === activeChatId);
    
    // Only generate name after third assistant reply and if we don't already have a name
    if (assistantMessages.length >= 3 && currentSession && !currentSession.name) {
      generateChatName(messages).then(name => {
        setChatSessions(prev => 
          prev.map(session => 
            session.id === activeChatId
              ? { ...session, name }
              : session
          )
        );
      });
    }
  }, [messages, chatSessions, activeChatId]);

  // Wrapper for adding messages to maintain the same interface
  const addMessage = (content: string, isUser: boolean) => {
    handleMessage(content, isUser, apiKey);
  };

  // Set the hero color
  const setHeroColor = (color: string) => {
    setHeroColorState(color);
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
      switchToChat
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
