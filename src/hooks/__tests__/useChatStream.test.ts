import { describe, it, expect } from 'vitest';
import { parseSSELine } from '../parseSSE';

describe('parseSSELine', () => {
  it('parses token event', () => {
    const line = 'data: {"type":"token","delta":"hi"}';
    expect(parseSSELine(line)).toEqual({ type: 'token', delta: 'hi' });
  });

  it('ignores unknown types', () => {
    const line = 'data: {"type":"image","url":"x"}';
    const evt = parseSSELine(line);
    expect(evt).toEqual({ type: 'image', url: 'x' } as any);
  });
});
