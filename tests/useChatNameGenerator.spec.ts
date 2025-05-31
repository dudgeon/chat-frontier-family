import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useChatNameGenerator } from '@/hooks/useChatNameGenerator';
import type { Message } from '@/types/chat';

vi.mock('@/utils/chatNameGenerator', () => ({
  generateChatName: vi.fn(() => Promise.resolve({ title: 'AI Title', sessionSummary: 'summary' })),
}));
vi.mock('@/components/ui/use-toast', () => ({ toast: vi.fn() }));

const pushMsgs = (
  msgs: Message[],
  rerender: (p: { msgs: Message[] }) => void,
  role: string,
) => {
  msgs.push({ content: 'hi', role } as Message);
  rerender({ msgs });
};

describe.skip('useChatNameGenerator', () => {
  it('requests metadata after every third assistant reply', async () => {
    const update = vi.fn();
    const stash = vi.fn();
    const messages: Message[] = [];
    const { rerender } = renderHook(
      (props: { msgs: Message[] }) =>
        useChatNameGenerator(props.msgs, null, 's1', update, stash, false),
      { initialProps: { msgs: messages } },
    );

    for (let i = 0; i < 3; i++) {
      pushMsgs(messages, rerender, 'user');
      pushMsgs(messages, rerender, 'assistant');
    }

    await act(() => Promise.resolve());
    const { generateChatName } = await import('@/utils/chatNameGenerator');
    expect(generateChatName).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith('s1', 'AI Title');
    expect(stash).toHaveBeenCalledWith('s1', 'summary');
  });
});
