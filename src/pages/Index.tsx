
import React, { useState } from 'react';
import { useChat } from '@/contexts/ChatContext';
import Header from '@/components/chat/Header';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import SettingsPanel from '@/components/settings/SettingsPanel';
import VoiceMode from '@/components/chat/VoiceMode';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

const Index: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
  const { 
    messages, 
    addMessage, 
    heroColor, 
    setHeroColor,
    createNewChat
  } = useChat();
  const { session } = useAuth();
  const { isEnabled } = useFeatureFlags();

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
    // If voice mode is disabled, show a toast and don't activate
    if (!isEnabled('voiceMode')) {
      toast({
        title: "Feature Unavailable",
        description: "Voice mode is currently disabled. We're working on improving it.",
      });
      return;
    }
    
    setIsVoiceModeActive(!isVoiceModeActive);
  };

  const handleNewChat = () => {
    try {
      if (createNewChat) {
        createNewChat();
      } else {
        console.error("createNewChat is not available in Index component");
        toast({
          title: "Error",
          description: "Could not create a new chat. Please refresh the page.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error creating new chat from Index:", error);
    }
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden flex flex-col md:flex-row bg-white">
      {/* Voice mode overlay - only render when feature is enabled and active */}
      {isEnabled('voiceMode') && isVoiceModeActive && (
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
        
        <div className="fixed bottom-0 left-0 right-0">
          <MessageInput 
            onSendMessage={handleSendMessage} 
            onVoiceButtonClick={toggleVoiceMode}
            showVoiceButton={isEnabled('voiceMode')}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
