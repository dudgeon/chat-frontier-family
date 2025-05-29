import { describe, it, expect } from 'vitest';
import { utf8Truncate } from '../utf8Truncate';

describe('utf8Truncate', () => {
  it('keeps valid emoji', () => {
    const result = utf8Truncate('hi🙂', 6);
    expect(result).toBe('hi🙂');
  });

  it('truncates without splitting', () => {
    const original = 'a🙂b';
    const result = utf8Truncate(original, 5);
    expect(result).toBe('a🙂');
  });

  it('limits to max bytes', () => {
    const big = 'a'.repeat(300);
    const result = utf8Truncate(big, 200);
    const encoder = new TextEncoder();
    expect(encoder.encode(result).length).toBeLessThanOrEqual(200);
  });
});
