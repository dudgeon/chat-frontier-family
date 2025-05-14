
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Message } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface ChatContextType {
  messages: Message[];
  addMessage: (content: string, isUser: boolean) => void;
  heroColor: string;
  setHeroColor: (color: string) => void;
  isWaitingForResponse: boolean;
  apiKey: string;
  setApiKey: (key: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([
    { content: "Hello! I'm powered by GPT-4o. How can I help you today?", isUser: false },
  ]);
  const [heroColor, setHeroColor] = useState<string>('#6366F1');
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [apiKey, setApiKey] = useState<string>(() => {
    const savedKey = localStorage.getItem('openai-api-key');
    return savedKey || '';
  });

  // Save API key to localStorage when it changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('openai-api-key', apiKey);
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
    
    // If this is a user message, get response from the edge function
    if (isUser) {
      setIsWaitingForResponse(true);
      
      try {
        // Format messages for OpenAI API
        const openaiMessages = messages.map(msg => ({
          role: msg.isUser ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));
        
        // Add the new user message
        openaiMessages.push({ role: 'user' as const, content });
        
        // Add system message at the beginning
        openaiMessages.unshift({ 
          role: 'system' as const, 
          content: 'You are a helpful assistant. Provide friendly, concise responses.'
        });
        
        // Call the Supabase edge function
        const { data, error } = await supabase.functions.invoke('chat', {
          body: { messages: openaiMessages }
        });

        if (error) {
          throw new Error(error.message);
        }
        
        if (data && data.content) {
          // Add AI response to messages
          setMessages(prev => [
            ...prev,
            { content: data.content, isUser: false, timestamp: new Date() }
          ]);
        } else if (data && data.error) {
          throw new Error(data.error);
        }
      } catch (error) {
        console.error('Error getting response:', error);
        toast({
          title: "Error",
          description: "Failed to get a response from the AI assistant. Please try again later.",
          variant: "destructive"
        });
        
        // Add an error message to the chat
        setMessages(prev => [
          ...prev,
          { 
            content: "I'm sorry, I couldn't process your request. Please try again later.", 
            isUser: false, 
            timestamp: new Date() 
          }
        ]);
      } finally {
        setIsWaitingForResponse(false);
      }
    }
  };

  return (
    <ChatContext.Provider value={{ 
      messages, 
      addMessage, 
      heroColor, 
      setHeroColor, 
      isWaitingForResponse,
      apiKey,
      setApiKey
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
