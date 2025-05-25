import { describe, it, expect, vi } from 'vitest';
import { accumulateAssistantText } from '../supabase/functions/chat/utils';

function makeStream(chunks: string[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(new TextEncoder().encode(c));
      controller.close();
    }
  });
}

describe('accumulateAssistantText', () => {
  it('accumulates assistant text and reports latency', async () => {
    const stream = makeStream([
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
      'data: [DONE]\n\n'
    ]);
    const onFirstChunk = vi.fn();
    const result = await accumulateAssistantText(stream, onFirstChunk);
    expect(result).toBe('Hello world');
    expect(onFirstChunk).toHaveBeenCalledTimes(1);
    expect(typeof onFirstChunk.mock.calls[0][0]).toBe('number');
  });

  it('handles trailing data without newline', async () => {
    const stream = makeStream([
      'data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" there"}}]}'
    ]);
    const result = await accumulateAssistantText(stream);
    expect(result).toBe('Hi there');
  });
});
