import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EditableField from '../EditableField';

describe.skip('EditableField', () => {
  it('allows editing and save on blur', () => {
    let val = 'test';
    const { getByRole } = render(
      <EditableField value={val} onChange={(v) => (val = v)} onSave={() => {}} />
    );
    fireEvent.click(getByRole('button'));
    const input = getByRole('textbox');
    fireEvent.change(input, { target: { value: 'x' } });
    fireEvent.blur(input);
    expect(val).toBe('x');
  });
});
