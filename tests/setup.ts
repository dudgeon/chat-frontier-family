import { vi } from 'vitest';

globalThis.fetch = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    storage: { from: vi.fn() },
  })),
}));
