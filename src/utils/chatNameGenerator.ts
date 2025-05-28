
import { invokeWithAuth } from '@/lib/invokeWithAuth';

export const generateChatName = async (
  sessionId: string,
): Promise<{ title: string; sessionSummary: string }> => {
  try {
    const { data, error } = await invokeWithAuth('generate-chat-name', {
      session_id: sessionId,
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
