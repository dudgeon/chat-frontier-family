
import { useState, useRef, useEffect } from 'react';

const FETCH_TIMEOUT_MS = 30000; // Abort streaming if no response within 30s
import { Message } from '@/types/chat';
import { supabase } from '@/lib/supa';
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
      // Handle /image prompt for DALL-E generation
      if (content.startsWith('/image ')) {
        const prompt = content.slice(7).trim();
        if (prompt) {
          setIsWaitingForResponse(true);
          try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const session = await supabase.auth.getSession();
            const accessToken = session.data.session?.access_token;

            const resp = await fetch(`${supabaseUrl}/functions/v1/generate-image`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                apikey: anon,
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
              },
              body: JSON.stringify({ prompt })
            });

            if (!resp.ok) {
              throw new Error(await resp.text());
            }

            const data = await resp.json();
            const url = data.url as string | undefined;
            if (url) {
              setMessages(prev => [
                ...prev,
                {
                  content: `![Generated Image](${url})`,
                  isUser: false,
                  timestamp: Date.now()
                }
              ]);
            } else {
              throw new Error('No image URL received');
            }
          } catch (err) {
            console.error('Image generation error', err);
            toast({
              title: 'Image generation failed',
              description: 'Unable to generate the requested image.',
              variant: 'destructive'
            });
          } finally {
            setIsWaitingForResponse(false);
          }
          return;
        }
      }

      setIsWaitingForResponse(true);

      let timeout: ReturnType<typeof setTimeout> | undefined;
      const controller = new AbortController();

      try {
        // Format messages for OpenAI API
        const openaiMessages = messages.map(msg => ({
          role: msg.isUser ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));

        // Add the new user message
        openaiMessages.push({ role: 'user' as const, content });

        // Add system message at the beginning so the assistant
        // receives proper context for the conversation
        openaiMessages.unshift({
          role: 'system' as const,
          content: systemMessageRef.current
        });

        // Debugging: log the full prompt (system + user)
        console.log('Full prompt to OpenAI:', openaiMessages);

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const session = await supabase.auth.getSession();
        const accessToken = session.data.session?.access_token;

        timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        const url = `${supabaseUrl}/functions/v1/chat`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: anon,
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
          },
          body: JSON.stringify({ input: openaiMessages, stream: true }),
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok || !response.body) {
          const errorText = await response.text();
          throw new Error(errorText);
        }

        // Prepare an empty assistant message for streaming updates
        const assistantMessage: Message = {
          content: '',
          isUser: false,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, assistantMessage]);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let done = false;
        let currentContent = '';

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          if (doneReading) {
            done = true;
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n');
          buffer = parts.pop() || '';
          for (const part of parts) {
            const line = part.trim();
            if (!line) continue;
            if (line.startsWith('data:')) {
              const dataStr = line.replace(/^data:\s*/, '');
              if (dataStr === '[DONE]') {
                done = true;
                break;
              }
              try {
                const json = JSON.parse(dataStr);
                const token =
                  json.choices?.[0]?.delta?.content ||
                  json.delta ||
                  json.response?.delta?.content ||
                  '';
                if (token) {
                  currentContent += token;
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      ...updated[updated.length - 1],
                      content: currentContent
                    };
                    return updated;
                  });
                }
              } catch (err) {
                console.error('Error parsing stream chunk', err);
              }
            }
          }
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          console.error('Request timed out');
        } else {
          console.error('Error getting response:', error);
        }
        toast({
          title: 'Error',
          description: 'Failed to get a response from the AI assistant. Please try again later.',
          variant: 'destructive'
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
        if (timeout) clearTimeout(timeout);
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
