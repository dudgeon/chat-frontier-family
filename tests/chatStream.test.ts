import { describe, it, expect, vi } from 'vitest';
import { pipeAndStore } from '../supabase/functions/chat/utils';

function makeStream(chunks: string[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(new TextEncoder().encode(c));
      controller.close();
    }
  });
}

describe('pipeAndStore', () => {
  it('stores assistant text from completion stream', async () => {
    const stream = makeStream([
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
      'data: [DONE]\n\n'
    ]);
    const insert = vi.fn().mockResolvedValue({});
    const supabase = { from: vi.fn(() => ({ insert })) } as any;
    const clientStream = pipeAndStore(stream, 'chat1', supabase, () => {});
    const reader = clientStream.getReader();
    while (!(await reader.read()).done) {
      /* empty */
    }
    await Promise.resolve();
    expect(insert).toHaveBeenCalledWith({ chat_id: 'chat1', role: 'assistant', content: 'Hello world' });
    expect(supabase.from).toHaveBeenCalledWith('chat_messages');
  });
});
