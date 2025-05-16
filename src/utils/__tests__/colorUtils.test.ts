import { describe, it, expect } from 'vitest';
import { hexToHSL } from '../colorUtils';

describe('hexToHSL', () => {
  it('converts red hex to hsl', () => {
    expect(hexToHSL('#ff0000')).toBe('0 100% 50%');
  });

  it('converts green hex to hsl', () => {
    expect(hexToHSL('#00ff00')).toBe('120 100% 50%');
  });

  it('converts blue hex to hsl', () => {
    expect(hexToHSL('#0000ff')).toBe('240 100% 50%');
  });

  it('converts gray hex to hsl', () => {
    expect(hexToHSL('#808080')).toBe('0 0% 50%');
  });

  it('converts white hex to hsl', () => {
    expect(hexToHSL('#ffffff')).toBe('0 0% 100%');
  });
});
