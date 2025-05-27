
import { Message } from '@/types/chat';
import { invokeWithAuth } from '@/lib/invokeWithAuth';

export const generateChatName = async (
  sessionId: string,
  messages: Message[],
): Promise<string> => {
  try {
    // Format messages for the API
    const chatHistory = messages.map(msg => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.content
    }));
    
    // Add a specific request to generate a short, descriptive title
    chatHistory.push({
      role: 'user',
      content: 'Based on our conversation so far, generate a very short, descriptive title (3-5 words max) that captures the essence of this chat. Respond with just the title, no additional text or explanation.'
    });
    
    // Call the Supabase edge function to generate a title
    const { data, error } = await invokeWithAuth('generate-chat-name', {
      session_id: sessionId,
      messages: chatHistory,
      model: 'gpt-4.1-nano'
    });

    if (error) {
      throw new Error(error.message);
    }
    
    if (data && (data.title ?? data.content)) {
      return (data.title ?? data.content).trim();
    }

    return 'Chat Session'; // Default fallback
  } catch (error) {
    console.error('Error generating chat name:', error);
    // Fallback to a default name if there's an error
    return 'Chat Session';
  }
};
