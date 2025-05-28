
import { invokeWithAuth } from '@/lib/invokeWithAuth';

import { Message } from '@/types/chat';

export const generateChatName = async (
  sessionId: string,
  messages: Message[],
): Promise<{ title: string; sessionSummary: string }> => {
  try {
    const formatted = messages.map(m => ({
      role: m.isUser ? 'user' : 'assistant',
      content: m.content,
    }));

    const { data, error } = await invokeWithAuth('generate-chat-name', {
      session_id: sessionId,
      messages: formatted,
    });

    if (error) {
      throw new Error(error.message);
    }
    
    if (data && data.title) {
      return {
        title: data.title.trim(),
        sessionSummary: data.session_summary ?? '',
      };
    }

    return { title: 'Chat Session', sessionSummary: '' };
  } catch (error) {
    console.error('Error generating chat name:', error);
    return { title: 'Chat Session', sessionSummary: '' };
  }
};
