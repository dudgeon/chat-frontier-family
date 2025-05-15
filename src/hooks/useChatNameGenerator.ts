
import { useEffect } from 'react';
import { Message } from '@/types/chat';
import { generateChatName } from '@/utils/chatNameGenerator';

export const useChatNameGenerator = (
  messages: Message[], 
  chatName: string | null, 
  activeChatId: string,
  updateChatName: (id: string, name: string) => void
) => {
  // Generate a chat name after the third reply
  useEffect(() => {
    const assistantMessages = messages.filter(m => !m.isUser);
    
    // Only generate name after third assistant reply and if we don't already have a name
    if (assistantMessages.length >= 3 && !chatName) {
      generateChatName(messages).then(name => {
        updateChatName(activeChatId, name);
      });
    }
  }, [messages, chatName, activeChatId, updateChatName]);
};
