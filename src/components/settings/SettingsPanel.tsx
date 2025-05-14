
import React from 'react';
import { X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ColorPicker from './ColorPicker';
import ChatHistory from './ChatHistory';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onColorChange: (color: string) => void;
  currentColor: string;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  onColorChange,
  currentColor
}) => {
  return (
    <div
      className={`fixed top-0 left-0 h-full w-72 bg-white shadow-lg z-20 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-handwritten text-2xl text-hero">frontier.family</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>
        
        <ScrollArea className="flex-1 px-4">
          <div className="py-6 border-b">
            <h3 className="text-sm font-semibold mb-4 flex items-center">
              Theme Color
            </h3>
            <ColorPicker currentColor={currentColor} onColorChange={onColorChange} />
          </div>
          
          <div className="py-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Clock size={16} />
              Chat History
            </h3>
            <ChatHistory />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default SettingsPanel;
