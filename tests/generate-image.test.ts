import { describe, it, expect, vi, beforeEach } from 'vitest';

const storageMock = {
  from: vi.fn(() => ({
    upload: vi.fn().mockResolvedValue({ error: null }),
  })),
};

async function handler(req: Request) {
  const { prompt } = await req.json().catch(() => ({}));
  if (!prompt) {
    return new Response('Missing prompt', { status: 400 });
  }
  await fetch('https://openai.test', { method: 'POST' });
  storageMock.from('chat-images').upload('file', new ArrayBuffer(0), { contentType: 'image/png' });
  return new Response('ok');
}

beforeEach(() => {
  globalThis.fetch = vi.fn() as any;
});

describe('generate-image handler', () => {
  it('returns 400 when prompt missing', async () => {
    const res = await handler(new Request('http://x', { method: 'POST', body: JSON.stringify({}) }));
    expect(res.status).toBe(400);
  });

  it('uploads when prompt provided', async () => {
    (globalThis.fetch as any).mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    const res = await handler(new Request('http://x', { method: 'POST', body: JSON.stringify({ prompt: 'cat' }) }));
    expect(res.status).toBe(200);
    expect(storageMock.from).toHaveBeenCalled();
  });
});
