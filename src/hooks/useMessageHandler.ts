
import { useState, useRef, useEffect } from 'react';
import { Message } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { DEFAULT_ADULT_SYSTEM_MESSAGE } from '@/config/systemMessages';

export const useMessageHandler = (
  initialMessages: Message[] = [],
  systemMessage: string = DEFAULT_ADULT_SYSTEM_MESSAGE
) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const systemMessageRef = useRef(systemMessage);

  useEffect(() => {
    systemMessageRef.current = systemMessage;
  }, [systemMessage]);

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
          content: systemMessageRef.current
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

  return { 
    messages, 
    setMessages,
    isWaitingForResponse, 
    addMessage
  };
};
