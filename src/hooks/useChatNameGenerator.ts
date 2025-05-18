
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
  const hasGeneratedRef = useRef(false);

  // Reset the generated flag when switching chats or a name is set externally
  useEffect(() => {
    hasGeneratedRef.current = !!chatName;
  }, [activeChatId, chatName]);

  // Generate a chat name after the third assistant reply, once streaming finishes
  useEffect(() => {
    const assistantMessages = messages.filter(m => !m.isUser);

    if (
      assistantMessages.length >= 3 &&
      !chatName &&
      !isWaitingForResponse &&
      !hasGeneratedRef.current
    ) {
      hasGeneratedRef.current = true;
      generateChatName(messages).then(name => {
        updateChatName(activeChatId, name);
      });
    }
  }, [messages, chatName, activeChatId, updateChatName, isWaitingForResponse]);
};
