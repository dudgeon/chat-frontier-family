
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

  // Keep track of how many assistant messages were present when a name
  // was last generated. Reset this count when switching chats or when the
  // chat name is manually edited so that subsequent generations occur on the
  // correct interval.
  useEffect(() => {
    lastGeneratedCountRef.current = messages.filter(m => !m.isUser).length;
  }, [activeChatId, chatName]);

  // Generate a chat name after every third assistant reply, once streaming finishes
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
      generateChatName(messages).then(name => {
        updateChatName(activeChatId, name);
      });
    }
  }, [messages, chatName, activeChatId, updateChatName, isWaitingForResponse]);
};
