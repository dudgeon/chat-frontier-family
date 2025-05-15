
import React, { useState } from 'react';
import { Send, Loader2, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChat } from '@/contexts/ChatContext';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onVoiceButtonClick?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, onVoiceButtonClick }) => {
  const [message, setMessage] = useState('');
  const { isWaitingForResponse } = useChat();

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && message.trim()) {
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-100 bg-white p-4 flex gap-2 items-center">
      <Input
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1"
        disabled={isWaitingForResponse}
      />
      
      <Button 
        className="bg-hero/80 hover:bg-hero text-white" 
        size="icon" 
        onClick={onVoiceButtonClick}
        disabled={isWaitingForResponse}
        title="Start voice conversation"
      >
        <Mic size={18} />
      </Button>
      
      <Button 
        className="bg-hero hover:bg-hero/90 text-white" 
        size="icon" 
        onClick={handleSend} 
        disabled={!message.trim() || isWaitingForResponse}
      >
        {isWaitingForResponse ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
      </Button>
    </div>
  );
};

export default MessageInput;
