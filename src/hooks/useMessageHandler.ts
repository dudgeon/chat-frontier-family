
import { useState, useRef, useEffect } from 'react';
import { Message } from '@/types/chat';
import { toast } from '@/components/ui/use-toast';
import { DEFAULT_ADULT_SYSTEM_MESSAGE } from '@/config/systemMessages';
import { useChatStream } from './useChatStream';

export const useMessageHandler = (
  initialMessages: Message[] = [],
  systemMessage: string = DEFAULT_ADULT_SYSTEM_MESSAGE,
  sessionId: string,
) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const systemMessageRef = useRef(systemMessage);
  const streamChat = useChatStream();

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

    if (isUser) {
      setIsWaitingForResponse(true);

      try {
        const openaiMessages = messages.map((msg) => ({
          role: msg.isUser ? 'user' as const : 'assistant' as const,
          content: msg.content,
        }));

        openaiMessages.push({ role: 'user' as const, content });

        openaiMessages.unshift({
          role: 'system' as const,
          content: systemMessageRef.current,
        });

        const assistantMessage: Message = {
          content: '',
          isUser: false,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        let currentContent = '';
        await streamChat(sessionId, openaiMessages, (token) => {
          currentContent += token;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: currentContent,
            };
            return updated;
          });
        });
      } catch (error) {
        console.error('Error getting response:', error);
        toast({
          title: 'Error',
          description:
            'Failed to get a response from the AI assistant. Please try again later.',
          variant: 'destructive',
        });
        setMessages((prev) => [
          ...prev,
          {
            content:
              "I'm sorry, I couldn't process your request. Please try again later.",
            isUser: false,
            timestamp: Date.now(),
          },
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
