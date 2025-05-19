import { useCallback } from 'react';
import { parseSSELine, SSEPacket } from './parseSSE';

export interface StreamOptions {
  messages: unknown;
  [key: string]: unknown;
}

export const useChatStream = () => {
  const send = useCallback(async (payload: StreamOptions, onToken: (t: string) => void) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const resp = await fetch(`${supabaseUrl}/functions/v1/chat?stream=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anon,
      },
      body: JSON.stringify(payload),
    });

    const isStream = resp.headers.get('X-Stream') === 'true';
    if (isStream && resp.body) {
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const evt = parseSSELine(line.trim());
          if (evt && evt.type === 'token' && evt.delta) {
            onToken(evt.delta);
          }
        }
      }
    } else {
      const json = await resp.json();
      if (json.content) onToken(json.content);
    }
  }, []);

  return { send };
};
