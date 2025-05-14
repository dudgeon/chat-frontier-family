
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Message } from '@/types/chat';

interface ChatContextType {
  messages: Message[];
  addMessage: (content: string, isUser: boolean) => void;
  heroColor: string;
  setHeroColor: (color: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([
    { content: "Hello! How can I help you today?", isUser: false },
  ]);
  const [heroColor, setHeroColor] = useState<string>('#6366F1');

  // Update CSS variable when hero color changes
  useEffect(() => {
    const root = document.documentElement;
    // Convert hex to HSL and update CSS variable
    const hexToHSL = (hex: string) => {
      // Remove the # if present
      hex = hex.replace(/^#/, '');
      
      // Parse the hex values
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      
      // Find the max and min values
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0;
      let s = 0;
      const l = (max + min) / 2;
      
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        
        h = Math.round(h * 60);
      }
      
      s = Math.round(s * 100);
      const lightness = Math.round(l * 100);
      
      return `${h} ${s}% ${lightness}%`;
    };
    
    root.style.setProperty('--hero', hexToHSL(heroColor));
  }, [heroColor]);

  const addMessage = (content: string, isUser: boolean) => {
    const newMessage: Message = {
      content,
      isUser,
      timestamp: new Date(),
    };
    
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    
    // Simulate AI response after user messages
    if (isUser) {
      setTimeout(() => {
        const responses = [
          "I understand what you're asking.",
          "That's an interesting question!",
          "Let me think about that for a moment.",
          "I can help you with that.",
          "Could you provide more details?",
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addMessage(randomResponse, false);
      }, 1000);
    }
  };

  return (
    <ChatContext.Provider value={{ messages, addMessage, heroColor, setHeroColor }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
