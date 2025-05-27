
import { useEffect, useRef } from 'react';
import { Message } from '@/types/chat';
import { generateChatName } from '@/utils/chatNameGenerator';
import { toast } from '@/components/ui/use-toast';

export const useChatNameGenerator = (
  messages: Message[],
  chatName: string | null,
  activeChatId: string,
  updateChatName: (id: string, name: string) => void,
  isWaitingForResponse: boolean
) => {
  const lastGeneratedCountRef = useRef(0);

  // Reset the generated count when switching chats or a name is set externally
  useEffect(() => {
    lastGeneratedCountRef.current = messages.filter(m => !m.isUser).length;
  }, [activeChatId]);

  // Generate a chat name after every third assistant reply
  useEffect(() => {
    const assistantMessages = messages.filter(m => !m.isUser);
    const count = assistantMessages.length;

    if (
      count >= 3 &&
      count % 3 === 0 &&
      !isWaitingForResponse &&
      count !== lastGeneratedCountRef.current
    ) {
      lastGeneratedCountRef.current = count;
      generateChatName(activeChatId, messages)
        .then((name) => {
          updateChatName(activeChatId, name);
        })
        .catch((err) => {
          console.error('generateChatName failed', err);
          toast({
            title: 'Failed to update chat title',
            variant: 'destructive',
          });
        });
    }
  }, [messages, activeChatId, updateChatName, isWaitingForResponse]);
};
