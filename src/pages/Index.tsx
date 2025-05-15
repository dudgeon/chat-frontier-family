
import React, { useState } from 'react';
import { useChat } from '@/contexts/ChatContext';
import Header from '@/components/chat/Header';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import SettingsPanel from '@/components/settings/SettingsPanel';
import VoiceMode from '@/components/chat/VoiceMode';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const Index: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
  const { messages, addMessage, heroColor, setHeroColor } = useChat();
  const { session } = useAuth();

  // Additional check to ensure the user is authenticated
  if (!session) {
    return <Navigate to="/login" />;
  }

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  const handleSendMessage = (message: string) => {
    addMessage(message, true);
  };

  const toggleVoiceMode = () => {
    setIsVoiceModeActive(!isVoiceModeActive);
  };

  return (
    <div className="relative h-screen flex flex-col md:flex-row bg-white">
      {/* Voice mode overlay */}
      {isVoiceModeActive && (
        <VoiceMode onClose={() => setIsVoiceModeActive(false)} />
      )}
      
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
          <MessageInput 
            onSendMessage={handleSendMessage} 
            onVoiceButtonClick={toggleVoiceMode}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
