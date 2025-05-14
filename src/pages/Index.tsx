
import React, { useState } from 'react';
import { useChat, ChatProvider } from '@/contexts/ChatContext';
import Header from '@/components/chat/Header';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import SettingsPanel from '@/components/settings/SettingsPanel';

const ChatInterface: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { messages, addMessage, heroColor, setHeroColor } = useChat();

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  const handleSendMessage = (message: string) => {
    addMessage(message, true);
  };

  return (
    <div className="relative h-screen flex flex-col md:flex-row bg-white">
      {/* Settings panel - now part of the flex layout on desktop */}
      <SettingsPanel 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onColorChange={setHeroColor}
        currentColor={heroColor}
      />
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col h-full relative">
        <Header toggleSettings={toggleSettings} />
        
        <main className="flex-1 overflow-hidden pt-14 pb-16 flex flex-col">
          <MessageList messages={messages} />
        </main>
        
        <div className="absolute bottom-0 left-0 right-0">
          <MessageInput onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
};

const Index: React.FC = () => {
  return (
    <ChatProvider>
      <ChatInterface />
    </ChatProvider>
  );
};

export default Index;
