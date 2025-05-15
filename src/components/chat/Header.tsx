
import React, { useState, useRef, useEffect } from 'react';
import { Menu, Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChat } from '@/contexts/ChatContext';

interface HeaderProps {
  toggleSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSettings }) => {
  const { chatName, createNewChat, activeChatId, updateChatName } = useChat();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // When edit mode is activated, set the edited name and focus the input
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleTitleClick = () => {
    setEditedName(chatName || '');
    setIsEditing(true);
  };

  const handleSave = () => {
    updateChatName(activeChatId, editedName);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 h-14 flex items-center px-4 z-10">
      <Button variant="ghost" size="icon" className="text-hero md:hidden" onClick={toggleSettings}>
        <Menu />
      </Button>
      
      {isEditing ? (
        <div className="flex-1 flex items-center gap-2 md:ml-16">
          <Input
            ref={inputRef}
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter chat name..."
            className="h-9"
            enterKeyHint={isIOS ? "done" : "enter"}
            autoCapitalize="sentences"
          />
          <div className="flex gap-1">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleSave}
              className="flex items-center h-9 px-2"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleCancel}
              className="flex items-center h-9 px-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <h1 
          className="flex-1 text-center md:text-left md:ml-16 font-medium text-gray-800 truncate cursor-pointer hover:text-hero transition-colors"
          onClick={handleTitleClick}
        >
          {chatName || "New chat"}
        </h1>
      )}
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-hero"
        onClick={createNewChat}
      >
        <Plus />
      </Button>
    </header>
  );
};

export default Header;
