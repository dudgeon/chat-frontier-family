
import React, { useState, useRef } from 'react';
import { Send, Loader2, Mic, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChat } from '@/contexts/ChatContext';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onVoiceButtonClick?: () => void;
  showVoiceButton?: boolean;
  onGenerateImage?: (prompt: string) => void;
  showImageButton?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onVoiceButtonClick,
  showVoiceButton = true,
  onGenerateImage,
  showImageButton = false
}) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { isWaitingForResponse } = useChat();

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      // Keep focus on the text entry for follow-up messages
      inputRef.current?.focus();
    }
  };

  const handleGenerateImage = () => {
    if (!onGenerateImage || !message.trim()) return;
    onGenerateImage(message);
    setMessage('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && message.trim()) {
      handleSend();
      // Keep focus after sending with Enter
      inputRef.current?.focus();
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
        ref={inputRef}
      />
      
      {/* Only show the voice button if the feature is enabled */}
      {showVoiceButton && onVoiceButtonClick && (
        <Button
          className="bg-hero/80 hover:bg-hero text-white"
          size="icon"
          onClick={onVoiceButtonClick}
          disabled={isWaitingForResponse}
          title="Start voice conversation"
        >
          <Mic size={18} />
        </Button>
      )}

      {showImageButton && onGenerateImage && (
        <Button
          className="bg-hero/80 hover:bg-hero text-white"
          size="icon"
          onClick={handleGenerateImage}
          disabled={!message.trim() || isWaitingForResponse}
          title="Generate image"
        >
          <ImageIcon size={18} />
        </Button>
      )}
      
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
