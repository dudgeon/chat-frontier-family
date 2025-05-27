
import { useEffect, useRef } from 'react';
import { Message } from '@/types/chat';
import { generateChatName } from '@/utils/chatNameGenerator';

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
    lastGeneratedCountRef.current = chatName
      ? messages.filter(m => !m.isUser).length
      : 0;
  }, [activeChatId, chatName]);

  // Generate a chat name after every third assistant reply, once streaming finishes
  useEffect(() => {
    const assistantMessages = messages.filter(m => !m.isUser);
    const count = assistantMessages.length;

    if (
      count >= 3 &&
      count % 3 === 0 &&
      !chatName &&
      !isWaitingForResponse &&
      count !== lastGeneratedCountRef.current
    ) {
      lastGeneratedCountRef.current = count;
      generateChatName(activeChatId, messages).then(name => {
        updateChatName(activeChatId, name);
      });
    }
  }, [messages, chatName, activeChatId, updateChatName, isWaitingForResponse]);
};
