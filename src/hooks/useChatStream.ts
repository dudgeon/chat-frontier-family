import { useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export async function parseSseStream(
  stream: ReadableStream<Uint8Array>,
  {
    onToken,
    onImage,
  }: { onToken?: (t: string) => void; onImage?: (u: string) => void },
) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const chunk = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 2);
      if (!chunk) continue;
      if (chunk.startsWith('data:')) {
        const dataStr = chunk.slice(5).trim();
        if (dataStr === '[DONE]') return;
        try {
          const payload = JSON.parse(dataStr);
          if (payload.type === 'image') {
            onImage?.(payload.url);
          } else {
            const delta =
              payload.delta ?? payload.response?.delta?.content ?? '';
            if (delta) onToken?.(delta);
          }
        } catch (err) {
          console.error('SSE parse error', err);
        }
      }
    }
  }
}

interface SendOpts {
  chatId: string;
  messages: unknown[];
  stream?: boolean;
  onToken?: (token: string) => void;
  onImage?: (url: string) => void;
}

export const useChatStream = () => {
  const ctrlRef = useRef<AbortController>();

  const send = async ({ chatId, messages, stream = true, onToken, onImage }: SendOpts) => {
    ctrlRef.current?.abort();
    const controller = new AbortController();
    ctrlRef.current = controller;

    const { data } = await supabase.auth.getSession();
    const access = data.session?.access_token;
    const anon =
      import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      import.meta.env.VITE_SUPABASE_ANON_KEY;
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anon,
        ...(access ? { Authorization: `Bearer ${access}` } : {}),
      },
      body: JSON.stringify({ chatId, messages, stream }),
      signal: controller.signal,
    });

    if (!resp.ok) throw new Error(await resp.text());

    if (stream) {
      if (!resp.body) throw new Error('No response body');
      await parseSseStream(resp.body, { onToken, onImage });
      return;
    }

    return resp.json();
  };

  const abort = () => ctrlRef.current?.abort();

  return { send, abort };
};
