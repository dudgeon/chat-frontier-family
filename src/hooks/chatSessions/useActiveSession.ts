
import { useState, useMemo } from 'react';
import { ChatSession } from '@/types/chatContext';

export const useActiveSession = (chatSessions: ChatSession[]) => {
  const [activeChatId, setActiveChatId] = useState<string>('');
  const [hiddenSessionIds, setHiddenSessionIds] = useState<string[]>([]);
  
  // Get visible chat sessions (not hidden)
  const visibleSessions = useMemo(() => {
    return chatSessions.filter(session => !hiddenSessionIds.includes(session.id));
  }, [chatSessions, hiddenSessionIds]);
  
  // Find the active chat session
  const activeSession = useMemo(() => {
    return chatSessions.find(s => s.id === activeChatId) || {
      id: activeChatId,
      name: null,
      messages: [],
      lastUpdated: null
    };
  }, [chatSessions, activeChatId]);
  
  // Hide a session without deleting it
  const hideSession = (sessionId: string) => {
    setHiddenSessionIds(prev => [...prev, sessionId]);
    
    // If hiding the active session, switch to another one
    if (sessionId === activeChatId && visibleSessions.length > 1) {
      const nextSession = visibleSessions.find(s => s.id !== sessionId);
      if (nextSession) {
        setActiveChatId(nextSession.id);
      }
    }
  };
  
  // Restore a hidden session
  const unhideSession = (sessionId: string) => {
    setHiddenSessionIds(prev => prev.filter(id => id !== sessionId));
  };
  
  return {
    activeChatId,
    setActiveChatId,
    activeSession,
    hiddenSessionIds,
    hideSession,
    unhideSession,
    visibleSessions
  };
};
