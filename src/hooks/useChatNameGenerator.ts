
import { useEffect, useRef } from 'react';
import { Message } from '@/types/chat';
import { generateChatName } from '@/utils/chatNameGenerator';
import { generateSessionName } from '@/utils/generateSessionName';
import { toast } from '@/components/ui/use-toast';
import { ASSISTANT } from '@/constants/roles';

export function getFallbackTitle(messages: Message[]): string | null {
  const first = messages.find((m) => (m as any).isUser)?.content;
  return first ? generateSessionName(first) : null;
}

export const useChatNameGenerator = (
  messages: Message[],
  chatName: string | null,
  activeChatId: string,
  updateChatName: (id: string, name: string) => void,
  stashSummary: (id: string, summary: string) => void,
  isWaitingForResponse: boolean
) => {
  const lastGeneratedCountRef = useRef(0);
  const initialTitle = useRef<string | null>(null);

  // Reset the generated count when switching chats or a name is set externally
  useEffect(() => {
    lastGeneratedCountRef.current = messages.filter(
      (m) => m.role && m.role.startsWith(ASSISTANT)
    ).length;
  }, [activeChatId]);

  const firstUserPrompt = getFallbackTitle(messages);
  if (!initialTitle.current && firstUserPrompt) {
    initialTitle.current = firstUserPrompt;
  }

  // Generate a chat name after every third assistant reply
  useEffect(() => {
    const assistantMessages = messages.filter(
      (m) => m.role && m.role.startsWith(ASSISTANT)
    );
    const count = assistantMessages.length;

    if (
      // Run after the third assistant reply
      count >= 3 &&
      count % 3 === 0 &&
      !isWaitingForResponse &&
      count !== lastGeneratedCountRef.current
    ) {
      lastGeneratedCountRef.current = count;
      generateChatName(activeChatId, messages)
        .then(({ title, sessionSummary }) => {
          updateChatName(activeChatId, title);
          stashSummary(activeChatId, sessionSummary);
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

  return chatName ?? initialTitle.current;
};
