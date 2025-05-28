import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./supa', () => ({
  supabase: {
    auth: { getSession: vi.fn() }
  }
}));

import { supabase } from './supa';
import { fetchWithAuth } from './fetchWithAuth';

beforeEach(() => {
  vi.resetAllMocks();
  globalThis.fetch = vi.fn() as any;
});

describe('fetchWithAuth', () => {
  it('adds bearer token when session exists', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: { access_token: 't' } } });
    (globalThis.fetch as any).mockResolvedValue('ok');
    await fetchWithAuth('/x', { method: 'GET' });
    const opts = (globalThis.fetch as any).mock.calls[0][1] as RequestInit;
    expect(opts.headers.get('Authorization')).toBe('Bearer t');
  });

  it('omits header when no session', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });
    (globalThis.fetch as any).mockResolvedValue('ok');
    await fetchWithAuth('/y');
    const opts = (globalThis.fetch as any).mock.calls[0][1] as RequestInit;
    expect((opts.headers as Headers).get('Authorization')).toBeNull();
  });
});
