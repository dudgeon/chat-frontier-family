import { useState, useEffect } from "react";
import { Message } from "@/types/chat";
import { ChatSession, ACTIVE_SESSION_KEY } from "@/types/chatContext";
import { useAuth } from "@/contexts/AuthContext";
import { useChatDatabase } from "./useChatDatabase";
import { useActiveSession } from "./useActiveSession";
import { useSessionManagement } from "./useSessionManagement";
import { useMessageManagement } from "./useMessageManagement";
import { supabase } from "@/lib/supa";

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

  // Listen for realtime updates to chat_sessions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("chat_sessions_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_sessions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setChatSessions((prev) => {
            if (payload.eventType === "DELETE") {
              const id = (payload.old as any).id as string;
              return prev.filter((s) => s.id !== id);
            }
            if (payload.eventType === "UPDATE") {
              const updated = payload.new as any;
              if (updated.hidden || updated.deleted_at) {
                return prev.filter((s) => s.id !== updated.id);
              }
              return prev.map((s) =>
                s.id === updated.id
                  ? {
                      ...s,
                      name: updated.name,
                      lastUpdated: updated.last_updated
                        ? new Date(updated.last_updated).getTime()
                        : s.lastUpdated,
                    }
                  : s,
              );
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const removeSessionLocal = (id: string) => {
    setChatSessions((prev) => prev.filter((s) => s.id !== id));

    if (activeChatId === id) {
      const remaining = chatSessions.filter((s) => s.id !== id);
      const next = remaining[0];
      if (next) {
        setActiveChatId(next.id);
        localStorage.setItem(ACTIVE_SESSION_KEY, next.id);
      } else {
        setActiveChatId("");
        localStorage.removeItem(ACTIVE_SESSION_KEY);
      }
    }
  };

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
    removeSessionLocal,
  };
};
