
import React from 'react';
import { Message } from '@/types/chat';
import { useChat } from '@/contexts/ChatContext';
import { Loader2 } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messageEndRef = React.useRef<HTMLDivElement>(null);
  const { isWaitingForResponse } = useChat();

  React.useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isWaitingForResponse]);

  return (
    <div className="flex flex-col gap-3 py-4 px-3 overflow-y-auto">
      {messages.map((message, index) => (
        <div
          key={index}
          className={message.isUser 
            ? 'message-bubble-user' 
            : 'message-bubble-other'}
        >
          {message.content}
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
