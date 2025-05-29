
import { useCallback, useEffect, useRef } from 'react';
import { Message } from '@/types/chat';
import { ChatSession } from '@/types/chatContext';
import { useAuth } from '@/contexts/AuthContext';
import { useChatDatabase } from './useChatDatabase';
import { generateSessionName } from '@/utils/generateSessionName';
import { toast } from '@/components/ui/use-toast';

export const useMessageManagement = (
  chatSessions: ChatSession[],
  setChatSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>,
  activeChatId: string
) => {
  const { user } = useAuth();
  const { updateSessionTimestampInDb, saveMessageToDb, initializeSessionName } = useChatDatabase();

  const chatSessionsRef = useRef(chatSessions);
  useEffect(() => {
    chatSessionsRef.current = chatSessions;
  }, [chatSessions]);

  const fallbackSet = useRef<Record<string, boolean>>({});

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

      // Find messages that haven't been saved yet (no ID)
      const unsavedIndices = messages
        .map((m, i) => (!m.id ? i : -1))
        .filter(i => i !== -1);

      for (const index of unsavedIndices) {
        const msg = messages[index];
        const newMessageId = await saveMessageToDb(activeChatId, msg);
        if (!newMessageId) continue;

        // Update the message in state with its new ID
        setChatSessions(prevSessions =>
          prevSessions.map(session => {
            if (session.id === activeChatId) {
              const updated = [...session.messages];
              updated[index] = { ...updated[index], id: newMessageId };
              return { ...session, messages: updated };
            }
            return session;
          })
        );

        // If session has no name yet and this is the first user message, set a name
        const session = chatSessionsRef.current.find(s => s.id === activeChatId);
        if (
          session &&
          !session.name &&
          msg.isUser &&
          !fallbackSet.current[activeChatId]
        ) {
          fallbackSet.current[activeChatId] = true;
          const newName = generateSessionName(msg.content);
          await initializeSessionName(activeChatId, newName);
          setChatSessions(prevSessions =>
            prevSessions.map(s =>
              s.id === activeChatId ? { ...s, name: newName } : s
            )
          );
        }
      }
    } catch (error) {
      console.error('Error updating session messages:', error);

      // Show toast for persistent errors but not transient ones
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        toast({
          title: 'Connection Issue',
          description: 'Unable to save messages to database. Check your connection.',
          variant: 'destructive'
        });
      }
    }
  }, [
    activeChatId,
    user,
    updateSessionTimestampInDb,
    saveMessageToDb,
    initializeSessionName,
    setChatSessions,
  ]);
  
  return { updateSessionMessages };
};
