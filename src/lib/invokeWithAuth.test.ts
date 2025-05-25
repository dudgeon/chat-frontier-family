import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./supa', () => {
  const supabase = {
    auth: { getSession: vi.fn() },
    functions: { invoke: vi.fn() }
  };
  return { supabase };
});

import { supabase } from './supa';
import { invokeWithAuth } from './invokeWithAuth';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('invokeWithAuth', () => {
  it('passes auth token when available', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: { access_token: 't' } } });
    (supabase.functions.invoke as any).mockResolvedValue('ok');
    const res = await invokeWithAuth('fn', { a: 1 });
    expect(supabase.functions.invoke).toHaveBeenCalledWith('fn', { body: { a: 1 }, headers: { Authorization: 'Bearer t' } });
    expect(res).toBe('ok');
  });

  it('omits header when no session', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });
    await invokeWithAuth('fn', { b: 2 });
    expect(supabase.functions.invoke).toHaveBeenCalledWith('fn', { body: { b: 2 }, headers: {} });
  });
});
