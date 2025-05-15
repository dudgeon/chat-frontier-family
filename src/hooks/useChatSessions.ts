
import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/types/chat';
import { ChatSession, SESSIONS_STORAGE_KEY, ACTIVE_SESSION_KEY, generateId } from '@/types/chatContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

export const useChatSessions = (initialMessages: Message[] = []) => {
  const { user } = useAuth();
  // Store sessions and active session ID
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Load sessions from database when user is authenticated
  useEffect(() => {
    const fetchUserSessions = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Fetch all chat sessions for the current user
        const { data, error } = await supabase
          .from('chat_sessions')
          .select('id, name, last_updated')
          .eq('user_id', user.id)
          .order('last_updated', { ascending: false });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Format data for our state
          const sessions = await Promise.all(data.map(async (session) => {
            // Fetch messages for this session
            const { data: messagesData, error: messagesError } = await supabase
              .from('chat_messages')
              .select('*')
              .eq('session_id', session.id)
              .order('created_at', { ascending: true });
            
            if (messagesError) throw messagesError;
            
            // Convert to our Message format
            const messages = messagesData.map(msg => ({
              id: msg.id,
              content: msg.content,
              isUser: msg.is_user,
              timestamp: new Date(msg.created_at).getTime()
            }));
            
            return {
              id: session.id,
              name: session.name,
              messages: messages,
              lastUpdated: new Date(session.last_updated).getTime()
            };
          }));
          
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
          const newSession = await createNewChatInDb();
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
    
    fetchUserSessions();
  }, [user]);

  // Find the active chat session
  const activeSession = chatSessions.find(s => s.id === activeChatId) || {
    id: activeChatId,
    name: null,
    messages: [],
    lastUpdated: null
  };
  
  // Create a new chat session in the database
  const createNewChatInDb = async () => {
    if (!user) {
      throw new Error('User must be logged in to create a chat');
    }
    
    const newId = generateId();
    const timestamp = Date.now();
    const welcomeMessage: Message = {
      content: "Hello! I'm powered by GPT-4o. How can I help you today?",
      isUser: false,
      timestamp: timestamp
    };
    
    try {
      console.log("Creating new session in database with ID:", newId);
      // Create session in database
      const { error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          id: newId,
          user_id: user.id,
          name: null,
          last_updated: new Date().toISOString()
        });
        
      if (sessionError) throw sessionError;
      
      // Add welcome message
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: newId,
          content: welcomeMessage.content,
          is_user: welcomeMessage.isUser,
          created_at: new Date(timestamp).toISOString()
        });
        
      if (messageError) throw messageError;
      
      const newSession = {
        id: newId,
        name: null,
        messages: [welcomeMessage],
        lastUpdated: timestamp
      };
      
      console.log("Created new chat session:", newSession);
      return newSession;
    } catch (error) {
      console.error("Error in createNewChatInDb:", error);
      throw error;
    }
  };

  // Create a new chat session
  const createNewChat = useCallback(async () => {
    try {
      console.log("useChatSessions: Creating new chat session...");
      const newSession = await createNewChatInDb();
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
      
      setChatSessions(prevSessions => [newSession, ...prevSessions]);
      setActiveChatId(newId);
      return newSession.messages;
    }
  }, [user]);

  // Switch to an existing chat
  const switchToChat = useCallback((id: string) => {
    const session = chatSessions.find(s => s.id === id);
    if (session) {
      setActiveChatId(id);
      localStorage.setItem(ACTIVE_SESSION_KEY, id);
      return session.messages;
    }
    return activeSession.messages;
  }, [chatSessions, activeSession]);

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
      try {
        const { error } = await supabase
          .from('chat_sessions')
          .update({ name: newName.trim() || null })
          .eq('id', id)
          .eq('user_id', user.id);
          
        if (error) {
          console.error('Error updating chat name:', error);
        }
      } catch (error) {
        console.error('Error updating chat name:', error);
      }
    }
  }, [user]);

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
      const { error: updateError } = await supabase
        .from('chat_sessions')
        .update({ last_updated: new Date().toISOString() })
        .eq('id', activeChatId)
        .eq('user_id', user.id);
        
      if (updateError) {
        console.error('Error updating session timestamp:', updateError);
      }
      
      // Find the most recent message - assuming it's the one we need to add
      const latestMessage = messages[messages.length - 1];
      if (!latestMessage) return;
      
      // Check if this message already exists in the database by checking if it has an ID
      if (!latestMessage.id) {
        // It's a new message, add it to the database
        const { data, error } = await supabase
          .from('chat_messages')
          .insert({
            session_id: activeChatId,
            content: latestMessage.content,
            is_user: latestMessage.isUser,
            created_at: new Date(latestMessage.timestamp || Date.now()).toISOString()
          })
          .select('id');
          
        if (error) {
          console.error('Error saving message:', error);
        } else if (data && data[0]) {
          // Update the message in our state with the new ID
          setChatSessions(prevSessions => 
            prevSessions.map(session => {
              if (session.id === activeChatId) {
                const updatedMessages = session.messages.map((msg, index) => {
                  if (index === messages.length - 1) {
                    return { ...msg, id: data[0].id };
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
  }, [activeChatId, user]);

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
