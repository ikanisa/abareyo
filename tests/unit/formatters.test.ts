import { describe, expect, it, vi } from 'vitest';

import { formatCurrency, percentage } from '@/lib/formatters';

describe('formatCurrency', () => {
  it('formats values with the provided currency code', () => {
    expect(formatCurrency(12500, 'RWF')).toMatch(/RWF/);
  });

  it('falls back gracefully when Intl formatting fails', () => {
    const spy = vi.spyOn(Intl, 'NumberFormat').mockImplementation(() => {
      throw new Error('Unsupported currency');
    });

    expect(formatCurrency(5000, 'XYZ')).toBe('5,000 XYZ');

    spy.mockRestore();
  });
});

describe('percentage', () => {
  it('calculates percentage rounded to whole numbers', () => {
    expect(percentage(25, 50)).toBe(50);
    expect(percentage(3, 4)).toBe(75);
  });

  it('returns 0 when total is 0 to avoid division by zero', () => {
    expect(percentage(10, 0)).toBe(0);
  });
});
