import { describe, it, expect, vi } from 'vitest';
import { fetchChild } from '../useChildView';

vi.mock('@/lib/supa', () => ({
  supabase: {
    auth: { getSession: vi.fn() }
  }
}));

const fetchMock = vi.fn();

global.fetch = fetchMock as any;



const supabase = (await import('@/lib/supa')).supabase;

describe('useChildView', () => {
  it('fetches child with auth header', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: { access_token: 't' } } });
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve({ profile: {}, sessions: [] }) });
    await fetchChild('c1');
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/children/c1'), expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer t' }) }));
  });
});
