import { useState, useEffect } from "react";
import { Message } from "@/types/chat";
import { ChatSession, ACTIVE_SESSION_KEY } from "@/types/chatContext";
import { useAuth } from "@/contexts/AuthContext";
import { useChatDatabase } from "./useChatDatabase";
import { useActiveSession } from "./useActiveSession";
import { useSessionManagement } from "./useSessionManagement";
import { useMessageManagement } from "./useMessageManagement";

export const useChatSessions = (initialMessages: Message[] = []) => {
  const { user } = useAuth();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { fetchUserSessions, createNewChatInDb } = useChatDatabase();

  const {
    activeChatId,
    setActiveChatId,
    activeSession,
    hiddenSessionIds,
    hideSession,
    unhideSession,
    visibleSessions,
  } = useActiveSession(chatSessions);

  const { createNewChat, switchToChat, updateChatName, deleteChat } =
    useSessionManagement(
      chatSessions,
      setChatSessions,
      activeChatId,
      setActiveChatId,
    );

  const { updateSessionMessages } = useMessageManagement(
    chatSessions,
    setChatSessions,
    activeChatId,
  );

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

          setChatSessions((prev) => {
            if (prev.length === 0) return sessions;

            const map = new Map(prev.map((s) => [s.id, s]));
            sessions.forEach((s) => {
              map.set(s.id, { ...map.get(s.id), ...s });
            });
            return Array.from(map.values());
          });

          if (!activeChatId) {
            const storedActiveId = localStorage.getItem(ACTIVE_SESSION_KEY);
            const validActiveId = sessions.some((s) => s.id === storedActiveId)
              ? storedActiveId
              : sessions[0].id;

            setActiveChatId(validActiveId);
            localStorage.setItem(ACTIVE_SESSION_KEY, validActiveId);
          }
        } else {
          // No sessions, create a new default one
          console.log("No existing sessions, creating a new one");
          const newSession = await createNewChatInDb(user.id);
          setChatSessions([newSession]);
          setActiveChatId(newSession.id);
          localStorage.setItem(ACTIVE_SESSION_KEY, newSession.id);
        }
      } catch (error) {
        console.error("Error fetching chat sessions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, [user, fetchUserSessions, createNewChatInDb, setActiveChatId]);

  // Clear sessions when user signs out
  useEffect(() => {
    if (!user) {
      setChatSessions([]);
      setActiveChatId("");
    }
  }, [user, setActiveChatId]);

  return {
    chatSessions,
    activeChatId,
    activeSession,
    isLoading,
    createNewChat,
    switchToChat,
    updateChatName,
    deleteChat,
    updateSessionMessages,
    hiddenSessionIds,
    hideSession,
    unhideSession,
    visibleSessions,
    deleteChat,
  };
};
