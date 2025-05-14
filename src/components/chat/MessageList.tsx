
import React from 'react';
import { Message } from '@/types/chat';

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messageEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col gap-3 py-4 px-3 overflow-y-auto">
      {messages.map((message, index) => (
        <div
          key={index}
          className={message.isUser 
            ? 'message-bubble-user' 
            : 'message-bubble-other bg-hero text-hero-foreground'}
        >
          {message.content}
        </div>
      ))}
      <div ref={messageEndRef} />
    </div>
  );
};

export default MessageList;
