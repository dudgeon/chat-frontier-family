
import React, { useState } from 'react';
import { useChat, ChatProvider } from '@/contexts/ChatContext';
import Header from '@/components/chat/Header';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import SettingsPanel from '@/components/settings/SettingsPanel';
import APIKeyInput from '@/components/settings/APIKeyInput';

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
    <div className="relative h-screen flex flex-col bg-white">
      {/* Overlay when settings is open on mobile */}
      {isSettingsOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-10 md:hidden"
          onClick={() => setIsSettingsOpen(false)}
        />
      )}
      
      <SettingsPanel 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onColorChange={setHeroColor}
        currentColor={heroColor}
        apiKeyComponent={<APIKeyInput />}
      />
      
      <Header toggleSettings={toggleSettings} />
      
      <main className="flex-1 overflow-hidden pt-14 pb-16 flex flex-col">
        <MessageList messages={messages} />
      </main>
      
      <div className="fixed bottom-0 left-0 right-0">
        <MessageInput onSendMessage={handleSendMessage} />
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
