
import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  toggleSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSettings }) => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 h-14 flex items-center px-4 z-10">
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-hero" 
        onClick={toggleSettings}
      >
        <Menu />
      </Button>
      <h1 className="ml-4 font-medium text-gray-800">Chat</h1>
    </header>
  );
};

export default Header;
