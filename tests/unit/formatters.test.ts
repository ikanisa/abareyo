import { describe, expect, it, vi } from 'vitest';

import { formatCurrency, formatDateTime, formatNumber, percentage } from '@/lib/formatters';

describe('formatCurrency', () => {
  it('formats values with the provided currency code', () => {
    expect(formatCurrency(12500, 'RWF')).toMatch(/RWF/);
  });

  it('respects provided locales for currency formatting', () => {
    expect(formatCurrency(12500, 'RWF', 'fr-RW')).toBe('12 500 RF');
  });

  it('falls back gracefully when Intl formatting fails', () => {
    const spy = vi.spyOn(Intl, 'NumberFormat').mockImplementation(() => {
      throw new Error('Unsupported currency');
    });

    expect(formatCurrency(5000, 'XYZ')).toBe('5,000 XYZ');

    spy.mockRestore();
  });
});

describe('formatNumber', () => {
  it('formats plain numbers using the supplied locale', () => {
    expect(formatNumber(25000, 'fr-RW')).toBe('25 000');
  });
});

describe('formatDateTime', () => {
  it('produces stable locale-aware date strings', () => {
    const value = formatDateTime('2024-01-01T15:30:00Z', 'fr-RW', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    });

    expect(value).toBe('1 janv. 2024, 15:30');
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
