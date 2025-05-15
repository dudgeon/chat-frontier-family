
import { useState, useMemo } from 'react';
import { ChatSession } from '@/types/chatContext';

export const useActiveSession = (chatSessions: ChatSession[]) => {
  const [activeChatId, setActiveChatId] = useState<string>('');
  
  // Find the active chat session
  const activeSession = useMemo(() => {
    return chatSessions.find(s => s.id === activeChatId) || {
      id: activeChatId,
      name: null,
      messages: [],
      lastUpdated: null
    };
  }, [chatSessions, activeChatId]);
  
  return {
    activeChatId,
    setActiveChatId,
    activeSession
  };
};
