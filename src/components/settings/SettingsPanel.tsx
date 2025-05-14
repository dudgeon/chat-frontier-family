
import React from 'react';
import { X, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ColorPicker from './ColorPicker';
import ChatHistory from './ChatHistory';
import { useChat } from '@/contexts/ChatContext';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const { heroColor, setHeroColor, createNewChat } = useChat();
  
  return (
    <>
      {/* Overlay for mobile when panel is open */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 z-10"
          onClick={onClose}
        />
      )}
      
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-lg z-20 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-handwritten text-2xl text-hero">frontier.family</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-hero md:hidden">
              <X size={20} />
            </Button>
          </div>
          
          <ScrollArea className="flex-1 px-4">
            <div className="py-6 border-b">
              <h3 className="text-sm font-semibold mb-4 flex items-center">
                Theme Color
              </h3>
              <ColorPicker currentColor={heroColor} onColorChange={setHeroColor} />
            </div>
            
            <div className="py-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Clock size={16} />
                  Chat History
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-hero hover:bg-hero/10" 
                  onClick={createNewChat}
                >
                  <Plus size={16} className="mr-1" />
                  New Chat
                </Button>
              </div>
              <ChatHistory />
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;
