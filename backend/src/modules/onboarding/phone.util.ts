const INTERNATIONAL_MIN_LENGTH = 10;
const INTERNATIONAL_MAX_LENGTH = 15;

export type PhoneValidationResult = {
  normalized?: string;
  reason?: string;
};

export function normalizeInternationalPhoneNumber(input: string | undefined | null): PhoneValidationResult {
  if (!input) {
    return { reason: 'missing' };
  }

  let value = input.trim();
  if (!value) {
    return { reason: 'empty' };
  }

  value = value.replace(/[\s().-]/g, '');

  if (value.startsWith('00')) {
    value = `+${value.slice(2)}`;
  }

  if (!value.startsWith('+')) {
    if (!/^\d+$/.test(value)) {
      return { reason: 'non_numeric' };
    }
    value = `+${value}`;
  }

  if (!/^\+[0-9]+$/.test(value)) {
    return { reason: 'invalid_chars' };
  }

  const digits = value.slice(1);
  if (digits.length < INTERNATIONAL_MIN_LENGTH || digits.length > INTERNATIONAL_MAX_LENGTH) {
    return { reason: 'length' };
  }

  return { normalized: `+${digits}` };
}

export function describePhoneValidation(reason?: string) {
  switch (reason) {
    case 'missing':
    case 'empty':
      return 'No number provided';
    case 'non_numeric':
      return 'Only digits are allowed when omitting the + prefix';
    case 'invalid_chars':
      return 'Only digits and an optional leading + are allowed';
    case 'length':
      return 'Phone numbers must be between 10 and 15 digits long';
    default:
      return 'Invalid phone number format';
  }
}
