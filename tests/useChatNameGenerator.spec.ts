import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Message } from '@/types/chat';
import { requestSessionMetadata } from '@/utils/requestSessionMetadata';

vi.mock('@/utils/requestSessionMetadata', () => ({
  requestSessionMetadata: vi.fn(() => Promise.resolve()),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function maybeTrigger(
  messages: Message[],
  isWaiting: boolean,
  ref: { current: number },
) {
  const assistantCount = messages.filter(m => m.role === 'assistant').length;
  if (
    assistantCount >= 3 &&
    assistantCount % 3 === 0 &&
    !isWaiting &&
    assistantCount !== ref.current
  ) {
    requestSessionMetadata('s1');
    ref.current = assistantCount;
  }
}

describe('useChatNameGenerator logic', () => {
  it('requests metadata after every third assistant reply', () => {
    const msgs: Message[] = [];
    const ref = { current: 0 };

    for (let i = 0; i < 3; i++) {
      msgs.push({ content: 'hi', role: 'user' } as Message);
      maybeTrigger(msgs, false, ref);
      msgs.push({ content: 'ok', role: 'assistant' } as Message);
      maybeTrigger(msgs, false, ref);
    }

    expect(requestSessionMetadata).toHaveBeenCalledTimes(1);
  });

  it('ignores user messages when counting', () => {
    const msgs: Message[] = [];
    const ref = { current: 0 };

    msgs.push({ content: 'u1', role: 'user' } as Message);
    maybeTrigger(msgs, false, ref);
    msgs.push({ content: 'a1', role: 'assistant' } as Message);
    maybeTrigger(msgs, false, ref);

    msgs.push({ content: 'u2', role: 'user' } as Message);
    maybeTrigger(msgs, false, ref);
    msgs.push({ content: 'a2', role: 'assistant' } as Message);
    maybeTrigger(msgs, false, ref);

    expect(requestSessionMetadata).not.toHaveBeenCalled();

    msgs.push({ content: 'u3', role: 'user' } as Message);
    maybeTrigger(msgs, false, ref);
    msgs.push({ content: 'a3', role: 'assistant' } as Message);
    maybeTrigger(msgs, false, ref);

    expect(requestSessionMetadata).toHaveBeenCalledTimes(1);
  });
});
