import { describePhoneValidation, normalizeInternationalPhoneNumber } from './phone.util.js';

describe('normalizeInternationalPhoneNumber', () => {
  it('normalizes local digits by prefixing plus', () => {
    const result = normalizeInternationalPhoneNumber('0788 123 456');
    expect(result.normalized).toBe('+0788123456');
    expect(result.reason).toBeUndefined();
  });

  it('accepts numbers with leading zeros that represent country codes', () => {
    const result = normalizeInternationalPhoneNumber('00250 788 123 456');
    expect(result.normalized).toBe('+250788123456');
  });

  it('rejects numbers that are too short', () => {
    const result = normalizeInternationalPhoneNumber('12345');
    expect(result.normalized).toBeUndefined();
    expect(result.reason).toBe('length');
    expect(describePhoneValidation(result.reason)).toContain('10 and 15');
  });

  it('rejects non-numeric characters', () => {
    const result = normalizeInternationalPhoneNumber('+250-ABC-123');
    expect(result.normalized).toBeUndefined();
    expect(result.reason).toBe('invalid_chars');
  });

  it('handles already normalized numbers gracefully', () => {
    const result = normalizeInternationalPhoneNumber('+250788123456');
    expect(result.normalized).toBe('+250788123456');
  });
});
