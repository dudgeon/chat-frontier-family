
import { useCallback } from 'react';
import { Message } from '@/types/chat';
import { ChatSession } from '@/types/chatContext';
import { useAuth } from '@/contexts/AuthContext';
import { useChatDatabase } from './useChatDatabase';

export const useMessageManagement = (
  chatSessions: ChatSession[],
  setChatSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>,
  activeChatId: string
) => {
  const { user } = useAuth();
  const { updateSessionTimestampInDb, saveMessageToDb } = useChatDatabase();

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
  }, [activeChatId, user, updateSessionTimestampInDb, saveMessageToDb, setChatSessions]);
  
  return { updateSessionMessages };
};
