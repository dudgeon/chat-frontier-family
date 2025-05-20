import React from "react";
import { Clock, MessageCircle, Loader2, EyeOff, Trash2 } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";

const ChatHistory: React.FC = () => {
  const {
    chatSessions,
    activeChatId,
    switchToChat,
    hideSession,
    deleteSession,
  } = useChat();
  const { canAccess } = useFeatureAccess();
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-6 text-gray-500">
        <MessageCircle className="mx-auto mb-2 text-gray-400" />
        <p className="text-sm">Sign in to see your chat history</p>
      </div>
    );
  }

  if (chatSessions.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <MessageCircle className="mx-auto mb-2 text-gray-400" />
        <p className="text-sm">No chat history yet</p>
        <p className="text-xs">Start a new conversation to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {chatSessions.map((session) => (
        <div
          key={session.id}
          className={`relative p-3 rounded-md hover:bg-gray-100 cursor-pointer transition-colors ${
            session.id === activeChatId
              ? "bg-hero/10 hover:bg-hero/15 border-l-2 border-hero"
              : ""
          }`}
          onClick={() => switchToChat(session.id)}
        >
          <h4 className="font-medium text-sm truncate">
            {session.name || "New chat"}
          </h4>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            <Clock size={12} />
            {session.lastUpdated
              ? formatDistanceToNow(session.lastUpdated, { addSuffix: true })
              : "Just now"}
          </p>

          <div className="absolute top-1 right-1 flex space-x-1">
            {canAccess("hideSessions") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  hideSession(session.id);
                }}
                className="p-1 rounded-full hover:bg-gray-100"
                aria-label="Hide session"
              >
                <EyeOff
                  size={14}
                  className="text-gray-400 hover:text-gray-500"
                />
              </button>
            )}
            {canAccess("deleteSessions") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSession(session.id);
                }}
                className="p-1 rounded-full hover:bg-red-100"
                aria-label="Delete session"
              >
                <Trash2
                  size={14}
                  className="text-gray-400 hover:text-red-500"
                />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatHistory;
