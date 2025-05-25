import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', null, 'bar')).toBe('foo bar');
  });

  it('applies tailwind-merge rules', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});
