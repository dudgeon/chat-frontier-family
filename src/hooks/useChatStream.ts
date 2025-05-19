import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/chat';

export const useChatStream = () => {
  return useCallback(
    async (
      sessionId: string,
      messages: Message[],
      onToken: (token: string) => void,
    ) => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const resp = await fetch(`${supabaseUrl}/functions/v1/chat?stream=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anon,
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ chat_id: sessionId, messages }),
      });

      if (resp.headers.get('X-Stream') === 'false' || !resp.body) {
        const data = await resp.json();
        onToken(data.content || '');
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n');
        buffer = parts.pop() || '';
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data:')) continue;
          const dataStr = line.replace(/^data:\s*/, '');
          if (dataStr === '[DONE]') return;
          try {
            const json = JSON.parse(dataStr);
            const token = json.response?.delta?.content || '';
            if (token) onToken(token);
          } catch {
            // ignore parse errors
          }
        }
      }
    },
    [],
  );
};
