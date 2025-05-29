import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { createClient } from '@supabase/supabase-js';

async function handler(id: string, summary: string) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  const supabase = url && key ? createClient(url, key) : null;
  if (supabase) {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ session_summary: summary })
      .eq('id', id);
    if (error) console.error('Failed to update session metadata', error);
  }
}

describe('generate-chat-name update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.SUPABASE_ANON_KEY = 'anon';
  });

  it('uses anon key when service role is missing', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));
    (createClient as unknown as Mock).mockReturnValue({ from });

    await handler('s1', 'summary');

    expect(createClient).toHaveBeenCalledWith('https://test.supabase.co', 'anon');
    expect(update).toHaveBeenCalledWith({ session_summary: 'summary' });
    expect(eq).toHaveBeenCalledWith('id', 's1');
  });

  it('writes session summary', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'svc';
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));
    (createClient as unknown as Mock).mockReturnValue({ from });

    await handler('s2', 'hello');

    expect(update).toHaveBeenCalledWith({ session_summary: 'hello' });
    expect(eq).toHaveBeenCalledWith('id', 's2');
  });
});
