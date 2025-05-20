import { describe, it, expect, vi } from 'vitest';
import { fetchOpenAIEvents } from '../supabase/functions/chat/openai';

describe('fetchOpenAIEvents', () => {
  it('returns stream body on 200', async () => {
    const resp = { ok: true, status: 200, body: {} } as any;
    global.fetch = vi.fn().mockResolvedValue(resp);
    const result = await fetchOpenAIEvents('abc', 'key');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/responses/abc/events',
      {
        headers: {
          Authorization: 'Bearer key',
          Accept: 'text/event-stream',
        },
      },
    );
    expect(result).toBe(resp);
  });

  it('handles redirect followed by 200', async () => {
    const resp = { ok: true, status: 200, body: {} } as any;
    global.fetch = vi.fn().mockResolvedValue(resp);
    const result = await fetchOpenAIEvents('def', 'k');
    expect(result.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('propagates error status', async () => {
    const resp = { ok: false, status: 401 } as any;
    global.fetch = vi.fn().mockResolvedValue(resp);
    const result = await fetchOpenAIEvents('ghi', 'secret');
    expect(result.status).toBe(401);
  });
});
