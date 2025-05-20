import React from "react";
import { MessageCircle, Loader2 } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import ChatSessionRow from "@/components/ChatSessionRow";

const ChatHistory: React.FC = () => {
  const { chatSessions, switchToChat } = useChat();
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
    <ul className="space-y-1">
      {chatSessions.map((session) => (
        <ChatSessionRow key={session.id} session={{ id: session.id, title: session.name || "New chat" }} onSelect={switchToChat} />
      ))}
    </ul>
  );
};

export default ChatHistory;
