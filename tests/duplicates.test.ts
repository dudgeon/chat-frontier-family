import { describe, it, expect } from 'vitest';
import { dedupeById } from '@/utils/dedupeById';

describe('dedupeById', () => {
  it('removes duplicate ids', () => {
    const arr = [
      { id: 'a' },
      { id: 'a' },
      { id: 'b' },
    ];
    const result = dedupeById(arr);
    expect(result).toEqual([{ id: 'a' }, { id: 'b' }]);
  });
});

