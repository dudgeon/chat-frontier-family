import { describe, it, expect, vi } from 'vitest';
import { waitForCompletion } from '../waitForCompletion';

describe('waitForCompletion', () => {
  it('immediate-complete', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'completed', output_text: 'hi' })
    });
    const result = await waitForCompletion(fetchMock as any, 'u', {});
    expect(result.status).toBe('completed');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
