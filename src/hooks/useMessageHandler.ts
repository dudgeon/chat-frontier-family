
import { useState } from 'react';
import { Message } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export const useMessageHandler = (initialMessages: Message[] = []) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);

  const addMessage = async (content: string, isUser: boolean, apiKey: string) => {
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

  // Delete message function
  const deleteMessage = async (messageId: string) => {
    try {
      // Delete from database
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        throw error;
      }

      // Update state if deletion was successful
      setMessages(prevMessages => 
        prevMessages.filter(message => message.id !== messageId)
      );
      
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  };

  return { 
    messages, 
    setMessages,
    isWaitingForResponse, 
    addMessage,
    deleteMessage
  };
};
