import { describe, it, expect, vi } from 'vitest';
import { waitForCompletion } from '../waitForCompletion';

function mockResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('waitForCompletion', () => {
  it('returns final text when polling succeeds', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(mockResponse({ status: 'in_progress' }))
      .mockResolvedValueOnce(mockResponse({ status: 'completed', output_text: 'done' }));

    const result = await waitForCompletion('https://api.example.com', 'abc', 'key', fetchMock, 2, 0);
    expect(result).toBe('done');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws with upstream status', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ error: 'bad' }, 401));
    await expect(waitForCompletion('x', 'y', 'z', fetchMock, 1, 0)).rejects.toMatchObject({ status: 401 });
  });
});
