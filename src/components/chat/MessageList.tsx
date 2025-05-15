
import React from 'react';
import { Message } from '@/types/chat';
import { useChat } from '@/contexts/ChatContext';
import { Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messageEndRef = React.useRef<HTMLDivElement>(null);
  const { isWaitingForResponse, deleteMessage } = useChat();
  const { user } = useAuth();
  const [userRole, setUserRole] = React.useState<string>('parent');
  
  // Fetch user role from profiles table
  React.useEffect(() => {
    if (user) {
      const fetchUserRole = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          return;
        }

        if (data) {
          setUserRole(data.user_role);
        }
      };
      
      fetchUserRole();
    }
  }, [user]);

  React.useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isWaitingForResponse]);

  const handleDeleteMessage = async (messageId: string | undefined) => {
    if (!messageId) {
      toast({
        title: "Error",
        description: "Cannot delete this message.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await deleteMessage(messageId);
      toast({
        title: "Success",
        description: "Message deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col gap-3 py-4 px-3 overflow-y-auto">
      {messages.map((message, index) => (
        <ContextMenu key={index}>
          <ContextMenuTrigger>
            <div
              className={`${message.isUser 
                ? 'message-bubble-user' 
                : 'message-bubble-other'} 
                ${message.isUser ? 'self-end' : 'self-start'}`}
            >
              {message.content}
            </div>
          </ContextMenuTrigger>
          {userRole === 'parent' && (
            <ContextMenuContent className="min-w-[160px]">
              <ContextMenuItem 
                onClick={() => handleDeleteMessage(message.id)}
                className="text-red-600 focus:text-red-600 flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete Message
              </ContextMenuItem>
            </ContextMenuContent>
          )}
        </ContextMenu>
      ))}
      
      {isWaitingForResponse && (
        <div className="message-bubble-other self-start flex items-center space-x-2">
          <Loader2 size={16} className="animate-spin" />
          <span>Thinking...</span>
        </div>
      )}
      
      <div ref={messageEndRef} />
    </div>
  );
};

export default MessageList;
