import { describe, it, expect } from 'vitest';
import { parseSseStream } from '../useChatStream';

function buildStream(chunks: string[]) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    }
  });
}

describe('parseSseStream', () => {
  it('streams tokens', async () => {
    const tokens: string[] = [];
    const stream = buildStream([
      'data: {"delta":"Hel"}\n\n',
      'data: {"delta":"lo"}\n\n',
      'data: [DONE]\n\n'
    ]);
    await parseSseStream(stream, { onToken: t => tokens.push(t) });
    expect(tokens.join('')).toBe('Hello');
  });
});
