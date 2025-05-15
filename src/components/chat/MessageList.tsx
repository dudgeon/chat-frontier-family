import React, { useState } from 'react';
import { Message } from '@/types/chat';
import { useChat } from '@/contexts/ChatContext';
import { Loader2, Trash2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messageEndRef = React.useRef<HTMLDivElement>(null);
  const { isWaitingForResponse, deleteMessage } = useChat();
  const { user } = useAuth();
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [isParentUser, setIsParentUser] = useState(false);

  // Check if user has parent role
  React.useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setIsParentUser(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setIsParentUser(false);
          return;
        }

        setIsParentUser(data.user_role === 'parent');
      } catch (error) {
        console.error('Error checking user role:', error);
        setIsParentUser(false);
      }
    };

    checkUserRole();
  }, [user]);

  React.useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isWaitingForResponse]);

  const handleDelete = (messageId?: string) => {
    if (!messageId) return;
    deleteMessage(messageId);
  };

  return (
    <div className="flex flex-col gap-3 py-4 px-3 overflow-y-auto">
      {messages.map((message, index) => (
        <div
          key={index}
          className={message.isUser 
            ? 'message-bubble-user relative' 
            : 'message-bubble-other relative'}
          onMouseEnter={() => setHoveredMessageId(message.id || null)}
          onMouseLeave={() => setHoveredMessageId(null)}
        >
          {message.content}
          
          {isParentUser && hoveredMessageId === message.id && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleDelete(message.id)}
                    className="absolute bottom-1 right-1 p-1 rounded-full bg-transparent hover:bg-red-100 transition-colors"
                    aria-label="Delete message"
                  >
                    <Trash2 size={14} className="text-gray-400 hover:text-red-500" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete message</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      ))}
      
      {isWaitingForResponse && (
        <div className="message-bubble-other flex items-center space-x-2">
          <Loader2 size={16} className="animate-spin" />
          <span>Thinking...</span>
        </div>
      )}
      
      <div ref={messageEndRef} />
    </div>
  );
};

export default MessageList;
