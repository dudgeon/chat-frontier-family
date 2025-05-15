
import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/types/chat';
import { ChatSession, ACTIVE_SESSION_KEY } from '@/types/chatContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { useChatDatabase } from './useChatDatabase';
import { useActiveSession } from './useActiveSession';

export const useChatSessions = (initialMessages: Message[] = []) => {
  const { user } = useAuth();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { 
    fetchUserSessions,
    createNewChatInDb,
    updateChatNameInDb,
    updateSessionTimestampInDb,
    saveMessageToDb
  } = useChatDatabase();
  
  const {
    activeChatId,
    setActiveChatId,
    activeSession
  } = useActiveSession(chatSessions);

  // Load sessions from database when user is authenticated
  useEffect(() => {
    const loadSessions = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        const sessions = await fetchUserSessions(user.id);
        
        if (sessions && sessions.length > 0) {
          console.log("Loaded chat sessions:", sessions.length);
          setChatSessions(sessions);
          
          // Set active chat to the most recently updated one
          const storedActiveId = localStorage.getItem(ACTIVE_SESSION_KEY);
          const validActiveId = sessions.some(s => s.id === storedActiveId)
            ? storedActiveId
            : sessions[0].id;
          
          setActiveChatId(validActiveId);
          localStorage.setItem(ACTIVE_SESSION_KEY, validActiveId);
        } else {
          // No sessions, create a new default one
          console.log("No existing sessions, creating a new one");
          const newSession = await createNewChatInDb(user.id);
          setChatSessions([newSession]);
          setActiveChatId(newSession.id);
          localStorage.setItem(ACTIVE_SESSION_KEY, newSession.id);
        }
      } catch (error) {
        console.error('Error fetching chat sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSessions();
  }, [user, fetchUserSessions, createNewChatInDb]);
  
  // Create a new chat session
  const createNewChat = useCallback(async () => {
    try {
      if (!user) {
        throw new Error('User must be logged in to create a chat');
      }
      
      console.log("useChatSessions: Creating new chat session...");
      const newSession = await createNewChatInDb(user.id);
      console.log("useChatSessions: New session created:", newSession);
      
      // Update state with the new session
      setChatSessions(prevSessions => [newSession, ...prevSessions]);
      
      // Set this as the active chat
      setActiveChatId(newSession.id);
      localStorage.setItem(ACTIVE_SESSION_KEY, newSession.id);
      
      return newSession.messages;
    } catch (error) {
      console.error('Error creating new chat:', error);
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to create a new chat session.",
        variant: "destructive"
      });
      
      // Fallback to local-only session if database fails
      const newId = Math.random().toString(36).substring(2, 15);
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
      
      setChatSessions(prevSessions => [newSession, ...prevSessions]);
      setActiveChatId(newId);
      return newSession.messages;
    }
  }, [user, createNewChatInDb, setActiveChatId]);

  // Switch to an existing chat
  const switchToChat = useCallback((id: string) => {
    const session = chatSessions.find(s => s.id === id);
    if (session) {
      setActiveChatId(id);
      localStorage.setItem(ACTIVE_SESSION_KEY, id);
      return session.messages;
    }
    return activeSession.messages;
  }, [chatSessions, activeSession, setActiveChatId]);

  // Update a chat name
  const updateChatName = useCallback(async (id: string, newName: string) => {
    // Update in state first for UI responsiveness
    setChatSessions(prevSessions => 
      prevSessions.map(session => 
        session.id === id
          ? { ...session, name: newName.trim() || null }
          : session
      )
    );
    
    // Then update in database
    if (user) {
      await updateChatNameInDb(id, user.id, newName);
    }
  }, [user, updateChatNameInDb]);

  // Update messages for active chat
  const updateSessionMessages = useCallback(async (messages: Message[]) => {
    if (!activeChatId || !user) return;
    
    // Update state for UI responsiveness
    setChatSessions(prevSessions => 
      prevSessions.map(session => 
        session.id === activeChatId
          ? { ...session, messages, lastUpdated: Date.now() }
          : session
      )
    );
    
    try {
      // Update last_updated timestamp in the database
      await updateSessionTimestampInDb(activeChatId, user.id);
      
      // Find the most recent message - assuming it's the one we need to add
      const latestMessage = messages[messages.length - 1];
      if (!latestMessage) return;
      
      // Check if this message already exists in the database by checking if it has an ID
      if (!latestMessage.id) {
        // It's a new message, add it to the database
        const newMessageId = await saveMessageToDb(activeChatId, latestMessage);
        
        if (newMessageId) {
          // Update the message in our state with the new ID
          setChatSessions(prevSessions => 
            prevSessions.map(session => {
              if (session.id === activeChatId) {
                const updatedMessages = session.messages.map((msg, index) => {
                  if (index === messages.length - 1) {
                    return { ...msg, id: newMessageId };
                  }
                  return msg;
                });
                return { ...session, messages: updatedMessages };
              }
              return session;
            })
          );
        }
      }
    } catch (error) {
      console.error('Error updating session messages:', error);
    }
  }, [activeChatId, user, updateSessionTimestampInDb, saveMessageToDb]);

  return { 
    chatSessions, 
    activeChatId, 
    activeSession,
    isLoading,
    createNewChat,
    switchToChat,
    updateChatName,
    updateSessionMessages
  };
};
