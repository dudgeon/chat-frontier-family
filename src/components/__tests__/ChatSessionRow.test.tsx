import { render, fireEvent } from '@testing-library/react';
import ChatSessionRow from '../ChatSessionRow';
import { describe, it, vi } from 'vitest';

vi.mock('@/lib/supa', () => ({ supabase: { functions: { invoke: vi.fn() } } }));
vi.mock('@/contexts/ChatContext', () => ({
  useChat: () => ({ hideSession: vi.fn(), removeSessionLocal: vi.fn() })
}));

describe.skip('ChatSessionRow', () => {
  const session = { id: '1', title: 'test' };

  it('renders with hover classes', () => {
    const { container } = render(
      <ul>
        <ChatSessionRow session={session} onSelect={() => {}} />
      </ul>
    );
    const icons = container.querySelector('div.absolute');
    expect(icons?.className).toMatch(/group-hover:opacity-100/);
  });

  it('toggles icons on touch', () => {
    const { container } = render(
      <ul>
        <ChatSessionRow session={session} onSelect={() => {}} />
      </ul>
    );
    const li = container.querySelector('li')!;
    const icons = container.querySelector('div.absolute')!;
    expect(icons.className).toContain('opacity-0');
    fireEvent.touchStart(li);
    expect(icons.className).toContain('opacity-100');
  });
});
