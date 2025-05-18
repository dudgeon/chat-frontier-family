
import { useCallback } from 'react';
import { Message } from '@/types/chat';
import { ChatSession } from '@/types/chatContext';
import { supabase } from '@/integrations/supabase/client';

export const useChatDatabase = () => {
  // Fetch all sessions for a user. If no userId is provided, use the
  // currently authenticated user.
  const fetchUserSessions = useCallback(async (userId?: string) => {
    if (!userId) {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) {
        throw error || new Error('Unable to determine user');
      }
      userId = user.id;
    }
    try {
      // Fetch all chat sessions for the current user
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('id, name, last_updated')
        .eq('user_id', userId)
        .order('last_updated', { ascending: false });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Format data for our state
        const sessions = await Promise.all(data.map(async (session) => {
          // Fetch messages for this session
        const { data: messagesData, error: messagesError } = await supabase
            .from('chat_messages')
            .select('id, content, is_user, created_at, session_id')
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
        
        return sessions;
      }
      
      return [];
    } catch (error) {
      console.error('Error in fetchUserSessions:', error);
      throw error;
    }
  }, []);

  // Create a new chat in the database
  const createNewChatInDb = useCallback(async (userId: string) => {
    if (!userId) {
      throw new Error('User must be logged in to create a chat');
    }
    
    const newId = Math.random().toString(36).substring(2, 15);
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
          user_id: userId,
          name: null,
          last_updated: new Date().toISOString()
        });
        
      if (sessionError) throw sessionError;
      
      // Add welcome message
      const { error: messageError, data } = await supabase
        .from('chat_messages')
        .insert({
          session_id: newId,
          content: welcomeMessage.content,
          is_user: welcomeMessage.isUser,
          created_at: new Date(timestamp).toISOString()
        })
        .select('id');
        
      if (messageError) throw messageError;
      
      // Add ID to the welcome message if available
      const messageWithId = data && data[0] ? 
        { ...welcomeMessage, id: data[0].id } : 
        welcomeMessage;
      
      const newSession = {
        id: newId,
        name: null,
        messages: [messageWithId],
        lastUpdated: timestamp
      };
      
      console.log("Created new chat session:", newSession);
      return newSession;
    } catch (error) {
      console.error("Error in createNewChatInDb:", error);
      throw error;
    }
  }, []);

  // Update a chat name in the database
  const updateChatNameInDb = useCallback(async (chatId: string, userId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ name: newName.trim() || null })
        .eq('id', chatId)
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error updating chat name:', error);
      }
    } catch (error) {
      console.error('Error updating chat name:', error);
    }
  }, []);

  // Set the initial chat name using a SECURITY DEFINER function
  const initializeSessionName = useCallback(async (chatId: string, name: string) => {
    try {
      const { error } = await supabase.rpc('set_session_name', {
        _session_id: chatId,
        _name: name
      });

      if (error) {
        console.error('Error initializing chat name:', error);
      }
    } catch (error) {
      console.error('Error initializing chat name:', error);
    }
  }, []);

  // Update session timestamp in the database
  const updateSessionTimestampInDb = useCallback(async (chatId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ last_updated: new Date().toISOString() })
        .eq('id', chatId)
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error updating session timestamp:', error);
      }
    } catch (error) {
      console.error('Error updating session timestamp:', error);
    }
  }, []);

  // Save a message to the database
  const saveMessageToDb = useCallback(async (chatId: string, message: Message) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: chatId,
          content: message.content,
          is_user: message.isUser,
          created_at: new Date(message.timestamp || Date.now()).toISOString()
        })
        .select('id');
        
      if (error) {
        console.error('Error saving message:', error);
        return null;
      } else if (data && data[0]) {
        return data[0].id;
      }
      
      return null;
    } catch (error) {
      console.error('Error saving message:', error);
      return null;
    }
  }, []);

  return {
    fetchUserSessions,
    createNewChatInDb,
    updateChatNameInDb,
    initializeSessionName,
    updateSessionTimestampInDb,
    saveMessageToDb
  };
};
