import { describe, expect, it } from 'vitest';
import { cn, formatPrice } from './utils';

describe('cn', () => {
  it('combina clases y resuelve conflictos', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-sm', false, 'font-bold')).toBe('text-sm font-bold');
  });
});

describe('formatPrice', () => {
  it('formatea como CLP', () => {
    expect(formatPrice(19990)).toContain('19.990');
  });
});
