
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
  chatName: string | null;
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
  const [chatName, setChatName] = useState<string | null>(null);
  
  // Save API key to localStorage when it changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('openai-api-key', apiKey);
    }
  }, [apiKey]);

  // Generate a chat name after the third reply
  useEffect(() => {
    const assistantMessages = messages.filter(m => !m.isUser);
    
    // Only generate name after third assistant reply and if we don't already have a name
    if (assistantMessages.length === 3 && !chatName) {
      generateChatName();
    }
  }, [messages, chatName]);

  // Function to generate a chat name based on conversation
  const generateChatName = async () => {
    try {
      // Format messages for the API
      const chatHistory = messages.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.content
      }));
      
      // Add a specific request to generate a short, descriptive title
      chatHistory.push({
        role: 'user',
        content: 'Based on our conversation so far, generate a very short, descriptive title (3-5 words max) that captures the essence of this chat. Respond with just the title, no additional text or explanation.'
      });
      
      // Call the Supabase edge function to generate a title
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { 
          messages: chatHistory,
          model: 'gpt-4o-mini',
          titleGeneration: true
        }
      });

      if (error) {
        throw new Error(error.message);
      }
      
      if (data && data.content) {
        // Set the generated name
        setChatName(data.content.trim());
      }
    } catch (error) {
      console.error('Error generating chat name:', error);
      // Fallback to a default name if there's an error
      setChatName('Chat Session');
    }
  };

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
      timestamp: Date.now(),
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
          role: 'user' as const, // Changed from 'system' to 'user' as a workaround
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
            { content: data.content, isUser: false, timestamp: Date.now() }
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
            timestamp: Date.now() 
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
      setApiKey,
      chatName
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
