
import { useState, useEffect } from 'react';
import { Message } from '@/types/chat';
import { ChatSession, SESSIONS_STORAGE_KEY, ACTIVE_SESSION_KEY, generateId } from '@/types/chatContext';

export const useChatSessions = (initialMessages: Message[] = []) => {
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
    return newSession.messages;
  };

  // Switch to an existing chat
  const switchToChat = (id: string) => {
    const session = chatSessions.find(s => s.id === id);
    if (session) {
      setActiveChatId(id);
      return session.messages;
    }
    return activeSession.messages;
  };

  // Update a chat name
  const updateChatName = (id: string, newName: string) => {
    setChatSessions(prev => 
      prev.map(session => 
        session.id === id
          ? { ...session, name: newName.trim() || null }
          : session
      )
    );
  };

  // Update messages for active chat
  const updateSessionMessages = (messages: Message[]) => {
    if (activeChatId) {
      setChatSessions(prev => 
        prev.map(session => 
          session.id === activeChatId
            ? { ...session, messages, lastUpdated: Date.now() }
            : session
        )
      );
    }
  };

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

  return { 
    chatSessions, 
    activeChatId, 
    activeSession,
    createNewChat,
    switchToChat,
    updateChatName,
    updateSessionMessages
  };
};
