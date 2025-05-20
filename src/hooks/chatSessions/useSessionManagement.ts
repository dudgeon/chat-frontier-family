import { useState, useCallback } from "react";
import { Message } from "@/types/chat";
import { ChatSession, ACTIVE_SESSION_KEY } from "@/types/chatContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { useChatDatabase } from "./useChatDatabase";

export const useSessionManagement = (
  chatSessions: ChatSession[],
  setChatSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>,
  activeChatId: string,
  setActiveChatId: React.Dispatch<React.SetStateAction<string>>,
) => {
  const { user } = useAuth();
  const { createNewChatInDb, updateChatNameInDb, deleteSessionFromDb } =
    useChatDatabase();

  // Create a new chat session
  const createNewChat = useCallback(async () => {
    try {
      if (!user) {
        throw new Error("User must be logged in to create a chat");
      }

      console.log("useSessionManagement: Creating new chat session...");
      const newSession = await createNewChatInDb(user.id);
      console.log("useSessionManagement: New session created:", newSession);

      // Update state with the new session
      setChatSessions((prevSessions) => [newSession, ...prevSessions]);

      // Set this as the active chat
      setActiveChatId(newSession.id);
      localStorage.setItem(ACTIVE_SESSION_KEY, newSession.id);

      return newSession.messages;
    } catch (error) {
      console.error("Error creating new chat:", error);
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to create a new chat session.",
        variant: "destructive",
      });

      // Fallback to local-only session if database fails
      const newId = Math.random().toString(36).substring(2, 15);
      const newSession = {
        id: newId,
        name: null,
        messages: [
          {
            content: "Hello! How can I help you today?",
            isUser: false,
            timestamp: Date.now(),
          },
        ],
        lastUpdated: Date.now(),
      };

      setChatSessions((prevSessions) => [newSession, ...prevSessions]);
      setActiveChatId(newId);
      return newSession.messages;
    }
  }, [user, createNewChatInDb, setActiveChatId, setChatSessions]);

  // Switch to an existing chat
  const switchToChat = useCallback(
    (id: string) => {
      const session = chatSessions.find((s) => s.id === id);
      if (session) {
        setActiveChatId(id);
        localStorage.setItem(ACTIVE_SESSION_KEY, id);
        return session.messages;
      }
      const activeSession = chatSessions.find((s) => s.id === activeChatId) || {
        id: activeChatId,
        name: null,
        messages: [],
        lastUpdated: null,
      };
      return activeSession.messages;
    },
    [chatSessions, activeChatId, setActiveChatId],
  );

  // Update a chat name
  const updateChatName = useCallback(
    async (id: string, newName: string) => {
      // Update in state first for UI responsiveness
      setChatSessions((prevSessions) =>
        prevSessions.map((session) =>
          session.id === id
            ? { ...session, name: newName.trim() || null }
            : session,
        ),
      );

      // Then update in database
      if (user) {
        await updateChatNameInDb(id, user.id, newName);
      }
    },
    [user, updateChatNameInDb, setChatSessions],
  );

  // Delete a chat session
  const deleteChat = useCallback(
    async (id: string) => {
      try {
        if (!user) {
          throw new Error("User must be logged in to delete a chat");
        }

        // Optimistically remove from state
        setChatSessions((prevSessions) =>
          prevSessions.filter((s) => s.id !== id),
        );

        // Update active session if needed
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

        await deleteSessionFromDb(id, user.id);

        toast({
          title: "Chat deleted",
          description: "The chat session has been removed.",
        });
      } catch (error) {
        console.error("Error deleting chat:", error);
        toast({
          title: "Error",
          description: "Failed to delete chat session.",
          variant: "destructive",
        });
      }
    },
    [
      user,
      deleteSessionFromDb,
      setChatSessions,
      activeChatId,
      chatSessions,
      setActiveChatId,
    ],
  );

  return {
    createNewChat,
    switchToChat,
    updateChatName,
    deleteChat,
  };
};
