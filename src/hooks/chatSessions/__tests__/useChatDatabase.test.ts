import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatDatabase } from '../useChatDatabase';
import type { Message } from '@/types/chat';

vi.mock('@/lib/supa', () => {
  const insertSelect = vi.fn().mockResolvedValue({ data: [{ id: '1' }], error: null });
  const insert = vi.fn(() => ({ select: insertSelect }));

  const makeQuery = (data: any[]) => {
    const obj: any = {};
    obj.select = vi.fn(() => obj);
    obj.eq = vi.fn(() => obj);
    obj.order = vi.fn(() => Promise.resolve({ data, error: null }));
    return obj;
  };

  const sessionsData = [
    { id: 's1', name: 'chat', last_updated: '2024-01-01T00:00:00Z' }
  ];
  const messagesData = [
    {
      id: 'm1',
      content: 'hi',
      is_user: false,
      created_at: '2024-01-01T00:00:00Z',
      session_id: 's1',
      image_url: 'img.png'
    }
  ];

  const from = vi.fn((table: string) => {
    if (table === 'chat_messages') {
      return { insert, ...makeQuery(messagesData) } as any;
    }
    if (table === 'chat_sessions') {
      return makeQuery(sessionsData) as any;
    }
    return {} as any;
  });

  return { supabase: { from, auth: { getUser: vi.fn() } } };
});

describe.skip('useChatDatabase', () => {
  it('saveMessageToDb sends image_url', async () => {
    const { result } = renderHook(() => useChatDatabase());
    const message: Message = { content: 'img', isUser: false, imageUrl: 'x', timestamp: 0 };
    await act(async () => {
      await result.current.saveMessageToDb('s1', message);
    });
    const supabase = (await import('@/lib/supa')).supabase;
    const insert = supabase.from('chat_messages').insert as any;
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ image_url: 'x' }));
  });

  it('fetchUserSessions returns imageUrl field', async () => {
    const { result } = renderHook(() => useChatDatabase());
    const sessions = await result.current.fetchUserSessions('u1');
    expect(sessions[0].messages[0].imageUrl).toBe('img.png');
  });
});
