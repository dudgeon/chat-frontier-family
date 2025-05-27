import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useChatNameGenerator } from '@/hooks/useChatNameGenerator';
import { Message } from '@/types/chat';

vi.mock('@/utils/chatNameGenerator', () => ({
  generateChatName: vi.fn(() => Promise.resolve('AI Title')),
}));
vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
}));

describe.skip('useChatNameGenerator', () => {
  it('calls generateChatName after three assistant replies', async () => {
    const update = vi.fn();
    const messages: Message[] = [];
    const { rerender } = renderHook((props: { msgs: Message[] }) =>
      useChatNameGenerator(props.msgs, null, 's1', update, false)
    , { initialProps: { msgs: messages } });

    const push = (content: string, isUser = false) => {
      messages.push({ content, isUser });
      rerender({ msgs: messages });
    };

    push('hi', false);
    push('there', false);
    await act(() => Promise.resolve());
    expect(update).not.toHaveBeenCalled();
    push('third', false);
    await act(() => Promise.resolve());
    expect(update).toHaveBeenCalledWith('s1', 'AI Title');
  });
});
