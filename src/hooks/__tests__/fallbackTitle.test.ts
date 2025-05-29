import { describe, it, expect } from 'vitest';
import { getFallbackTitle } from '../useChatNameGenerator';

const msgs = (content: string) => [{ content, isUser: true } as any];

describe('getFallbackTitle', () => {
  it('returns first user prompt truncated', () => {
    expect(getFallbackTitle(msgs('hello'))).toBe('hello');
  });

  it('prefers first message only', () => {
    const messages = [
      { content: 'first', isUser: true },
      { content: 'second', isUser: true },
    ] as any;
    expect(getFallbackTitle(messages)).toBe('first');
  });
});
