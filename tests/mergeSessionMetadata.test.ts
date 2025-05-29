import { describe, it, expect, vi } from 'vitest';
import { mergeSessionMetadata } from '@/hooks/chatSessions/useChatSessions';
import type { ChatSession } from '@/types/chatContext';

describe('mergeSessionMetadata', () => {
  it('applies updates within 1s', () => {
    vi.useFakeTimers();
    let session: ChatSession = {
      id: 's1',
      name: null,
      messages: [],
      lastUpdated: 1000,
      sessionSummary: '',
    };
    const updated = {
      id: 's1',
      name: 'AI Title',
      last_updated: new Date(1000).toISOString(),
      session_summary: 'sum',
    };
    setTimeout(() => {
      session = mergeSessionMetadata(session, updated);
    }, 500);

    vi.advanceTimersByTime(1000);
    expect(session.name).toBe('AI Title');
    vi.useRealTimers();
  });
});
