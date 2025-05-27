import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import SessionListItem from '../SessionListItem';

// basic server-side render test without jsdom

describe('SessionListItem', () => {
  it('renders title text', () => {
    const html = renderToString(
      <ul>
        <SessionListItem session={{ id: '1', name: 'chat', description: 'hello', lastUpdated: '2024-01-01T00:00:00Z' }} onSelect={vi.fn()} />
      </ul>
    );
    expect(html).toContain('chat');
    expect(html).toContain('hello');
  });
});
