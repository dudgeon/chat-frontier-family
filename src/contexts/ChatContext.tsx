
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Message } from '@/types/chat';
import { getOpenAIResponse } from '@/utils/openai';
import { toast } from '@/components/ui/use-toast';

interface ChatContextType {
  messages: Message[];
  addMessage: (content: string, isUser: boolean) => void;
  heroColor: string;
  setHeroColor: (color: string) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  isWaitingForResponse: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'openai-api-key';

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([
    { content: "Hello! I'm powered by GPT-4o. How can I help you today?", isUser: false },
  ]);
  const [heroColor, setHeroColor] = useState<string>('#6366F1');
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEY) || '';
  });
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);

  // Save API key to localStorage when it changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem(LOCAL_STORAGE_KEY, apiKey);
    }
  }, [apiKey]);

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

  const addMessage = async (content: string, isUser: boolean) => {
    const newMessage: Message = {
      content,
      isUser,
      timestamp: new Date(),
    };
    
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    
    // If this is a user message, get response from OpenAI
    if (isUser && apiKey) {
      setIsWaitingForResponse(true);
      
      try {
        // Format messages for OpenAI API
        const openaiMessages = messages.map(msg => ({
          role: msg.isUser ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));
        
        // Add the new user message
        openaiMessages.push({ role: 'user', content });
        
        // Add system message at the beginning
        openaiMessages.unshift({ 
          role: 'system', 
          content: 'You are a helpful assistant. Provide friendly, concise responses.'
        });
        
        // Get response from OpenAI
        const response = await getOpenAIResponse(openaiMessages, apiKey);
        
        if (response) {
          // Add AI response to messages
          setMessages(prev => [
            ...prev,
            { content: response, isUser: false, timestamp: new Date() }
          ]);
        }
      } catch (error) {
        console.error('Error getting response from OpenAI:', error);
        toast({
          title: "Error",
          description: "Failed to get a response. Please check your API key.",
          variant: "destructive"
        });
      } finally {
        setIsWaitingForResponse(false);
      }
    } else if (isUser && !apiKey) {
      // If no API key is set, add a message prompting the user to add one
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          { 
            content: "Please provide your OpenAI API key in the settings panel to enable GPT-4o responses.", 
            isUser: false, 
            timestamp: new Date() 
          }
        ]);
      }, 500);
    }
  };

  return (
    <ChatContext.Provider value={{ 
      messages, 
      addMessage, 
      heroColor, 
      setHeroColor, 
      apiKey, 
      setApiKey,
      isWaitingForResponse 
    }}>
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
