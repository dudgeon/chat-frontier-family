
import { toast } from '@/components/ui/use-toast';

const API_URL = 'https://api.openai.com/v1/chat/completions';

export const getOpenAIResponse = async (
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  apiKey: string
) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Error connecting to OpenAI');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    toast({
      title: "API Error",
      description: error instanceof Error ? error.message : "Failed to connect to OpenAI",
      variant: "destructive"
    });
    console.error('OpenAI API error:', error);
    return null;
  }
};
