
import React from 'react';
import { X, Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ColorPicker from './ColorPicker';
import ChatHistory from './ChatHistory';
import { useChat } from '@/contexts/ChatContext';
import { Link } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onColorChange?: (color: string) => void;
  currentColor?: string;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  onColorChange,
  currentColor
}) => {
  const {
    heroColor,
    setHeroColor,
    createNewChat
  } = useChat();

  // Use the props if provided, otherwise use the context values
  const handleColorChange = (color: string) => {
    if (onColorChange) {
      onColorChange(color);
    } else {
      setHeroColor(color);
    }
  };
  
  const activeColor = currentColor || heroColor;
  
  const handleNewChat = () => {
    try {
      console.log("SettingsPanel: Creating new chat session...");
      if (typeof createNewChat === 'function') {
        createNewChat();
      } else {
        console.error("createNewChat function is not available in SettingsPanel");
        toast({
          title: "Error",
          description: "Could not create a new chat. Please refresh the page.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error creating new chat from SettingsPanel:", error);
    }
  };
  
  return (
    <>
      {/* Overlay for mobile when panel is open */}
      {isOpen && <div className="md:hidden fixed inset-0 bg-black/20 z-10" onClick={onClose} />}
      
      <div className={`fixed top-0 left-0 h-full w-72 bg-white shadow-lg z-20 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} md:relative md:z-auto md:shadow-none md:border-r md:border-hero/30`}>
        <div className="flex flex-col h-full">
          
          <ScrollArea className="flex-1 px-4">
            <div className="py-6 mt-4 md:mt-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <Link to="/profile">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="rounded-full"
                      style={{ color: heroColor }}
                    >
                      <User />
                      <span className="sr-only">Profile</span>
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-hero hover:bg-hero/10" 
                    onClick={handleNewChat}
                  >
                    <Plus size={16} className="mr-1" />
                    New Chat
                  </Button>
                </div>
              </div>
              <ChatHistory />
            </div>
          </ScrollArea>
          
          {/* Color picker moved to bottom and made sticky */}
          <div className="sticky bottom-0 bg-white border-t p-4 shadow-md md:shadow-none md:border-t md:border-hero/30">
            <ColorPicker currentColor={activeColor} onColorChange={handleColorChange} />
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;
