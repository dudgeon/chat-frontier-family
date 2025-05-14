
import React from 'react';
import { Menu, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat } from '@/contexts/ChatContext';

interface HeaderProps {
  toggleSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSettings }) => {
  const { chatName, createNewChat } = useChat();
  
  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 h-14 flex items-center px-4 z-10">
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-hero md:hidden" 
        onClick={toggleSettings}
      >
        <Menu />
      </Button>
      <h1 className="flex-1 text-center md:text-left md:ml-16 font-medium text-gray-800 truncate">
        {chatName || "New chat"}
      </h1>
      <Button 
        variant="outline" 
        size="sm" 
        className="text-hero border-hero/20 hover:bg-hero/10 hover:text-hero md:hidden"
        onClick={createNewChat}
      >
        <Plus size={16} className="mr-1" />
        New Chat
      </Button>
    </header>
  );
};

export default Header;
