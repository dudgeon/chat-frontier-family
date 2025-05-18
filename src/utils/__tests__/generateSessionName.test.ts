import { describe, it, expect } from 'vitest';
import { generateSessionName } from '../generateSessionName';

describe('generateSessionName', () => {
  it('returns trimmed prompt when under limit', () => {
    expect(generateSessionName('  Hello Codex  ')).toBe('Hello Codex');
  });

  it('truncates long prompt with ellipsis', () => {
    const input = 'a'.repeat(45);
    expect(generateSessionName(input)).toBe('a'.repeat(40) + '…');
  });
});
