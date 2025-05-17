
import React, { useState } from 'react';
import { Message } from '@/types/chat';
import { useChat } from '@/contexts/ChatContext';
import { Loader2, Trash2, EyeOff } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import ReactMarkdown from 'react-markdown';

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messageEndRef = React.useRef<HTMLDivElement>(null);
  const { isWaitingForResponse, deleteMessage } = useChat();
  const { canAccess } = useFeatureAccess();
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [hiddenMessageIds, setHiddenMessageIds] = useState<string[]>([]);

  React.useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isWaitingForResponse]);

  const handleDelete = (messageId?: string) => {
    if (!messageId) return;
    deleteMessage(messageId);
  };

  const handleHideMessage = (messageId?: string) => {
    if (!messageId) return;
    setHiddenMessageIds(prev => [...prev, messageId]);
    // Future implementation: Save hidden state to user preferences
  };

  const visibleMessages = messages.filter(msg => !hiddenMessageIds.includes(msg.id || ''));

  return (
    <div className="flex flex-col gap-3 py-4 px-3 overflow-y-auto">
      {visibleMessages.map((message, index) => (
        <div
          key={index}
          className={message.isUser 
            ? 'message-bubble-user relative' 
            : 'message-bot relative px-4 py-2 max-w-[85%] self-start text-foreground'}
          onMouseEnter={() => setHoveredMessageId(message.id || null)}
          onMouseLeave={() => setHoveredMessageId(null)}
        >
          {message.isUser ? (
            message.content
          ) : (
            <div className="prose prose-sm dark:prose-invert">
              <ReactMarkdown components={{
                // Remove unnecessary line breaks in list items
                li: ({node, className, children, ...props}) => {
                  return <li {...props}>{children}</li>;
                },
                // Fix line breaks in paragraphs
                p: ({node, className, children, ...props}) => {
                  return <p {...props} className="whitespace-normal">{children}</p>;
                },
                // Fix line breaks in ordered list items
                ol: ({node, className, children, ...props}) => {
                  return <ol {...props} className="space-y-1">{children}</ol>;
                },
                // Fix line breaks in unordered list items
                ul: ({node, className, children, ...props}) => {
                  return <ul {...props} className="space-y-1">{children}</ul>;
                }
              }}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
          
          {hoveredMessageId === message.id && (
            <div className="absolute bottom-1 right-1 flex space-x-1">
              {canAccess('hideMessages') && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleHideMessage(message.id)}
                        className="p-1 rounded-full bg-transparent hover:bg-gray-100 transition-colors"
                        aria-label="Hide message"
                      >
                        <EyeOff size={14} className="text-gray-400 hover:text-gray-500" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Hide message</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {canAccess('deleteMessages') && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleDelete(message.id)}
                        className="p-1 rounded-full bg-transparent hover:bg-red-100 transition-colors"
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
          )}
        </div>
      ))}
      
      {isWaitingForResponse && (
        <div className="message-bot px-4 py-2 max-w-[85%] self-start text-foreground flex items-center space-x-2">
          <Loader2 size={16} className="animate-spin" />
          <span>Thinking...</span>
        </div>
      )}
      
      <div ref={messageEndRef} />
    </div>
  );
};

export default MessageList;
