import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useChatNameGenerator } from '../useChatNameGenerator';
import type { Message } from '@/types/chat';
import { ASSISTANT_STREAM } from '@/constants/roles';

vi.mock('@/utils/chatNameGenerator', () => ({
  generateChatName: vi.fn(() => Promise.resolve({ title: 'AI Title', sessionSummary: 'summary' })),
}));

vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
}));

describe.skip('useChatNameGenerator', () => {
  it('triggers after three assistant-stream messages', async () => {
    const update = vi.fn();
    const stash = vi.fn();
    const messages: Message[] = [];

    const { rerender } = renderHook(
      (props: { msgs: Message[] }) =>
        useChatNameGenerator(props.msgs, null, 's1', update, stash, false),
      { initialProps: { msgs: messages } }
    );

    const push = (role: string) => {
      messages.push({ content: 'hi', role });
      rerender({ msgs: messages });
    };

    push(ASSISTANT_STREAM);
    push(ASSISTANT_STREAM);
    await act(() => Promise.resolve());
    expect(update).not.toHaveBeenCalled();

    push(ASSISTANT_STREAM);
    await act(() => Promise.resolve());
    expect(update).toHaveBeenCalledWith('s1', 'AI Title');
    expect(stash).toHaveBeenCalledWith('s1', 'summary');
  });
});
