import { describe, it, expect, vi } from 'vitest';
import { useChatStream } from '../useChatStream';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../lib/supa', () => ({
  supabase: { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 't' } } }) } }
}));

global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ content: 'done' })
}) as any;

describe('useChatStream send non-stream', () => {
  it('returns content', async () => {
    const { result } = renderHook(() => useChatStream());
    let data: any;
    await act(async () => {
      data = await result.current.send({ chatId: '1', messages: [], stream: false });
    });
    expect(data.content).toBe('done');
  });
});
