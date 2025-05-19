import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleRequest } from '../index.ts';

// mock env
(globalThis as any).Deno = { env: { get: () => 'test-key' } };

const buildRequest = (stream = true) =>
  new Request(`http://localhost?stream=${stream}`, {
    method: 'POST',
    body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
  });

describe('chat edge handler', () => {
  let originalFetch: any;
  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('streams events on happy path', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: '1' }), { status: 200 })
      )
      .mockResolvedValueOnce(new Response('data: hello\n\n', { status: 200 }));

    const res = await handleRequest(buildRequest(true));
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');
    const text = await res.text();
    expect(text).toContain('data:');
  });

  it('returns error on openai 4xx', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response('bad', { status: 401 }));

    const res = await handleRequest(buildRequest(true));
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it('handles network abort', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network'));

    const res = await handleRequest(buildRequest(true));
    expect(res.status).toBe(503);
  });
});
