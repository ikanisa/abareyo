export const sanitizeDigits = (value: string, { allowPlus = false, max = 20 } = {}) => {
  const pattern = allowPlus ? /[^0-9+]/g : /\D/g;
  const cleaned = value.replace(pattern, '');
  return cleaned.slice(0, max);
};

export const normalizeWhatsappNumber = (input: unknown): string | null => {
  if (typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const digits = sanitizeDigits(trimmed, { allowPlus: true, max: 20 });
  if (!digits) {
    return null;
  }

  if (digits.startsWith('+')) {
    return `+${digits.slice(1)}`;
  }

  if (digits.startsWith('00')) {
    return `+${digits.slice(2)}`;
  }

  if (digits.startsWith('2507')) {
    return `+${digits}`;
  }

  if (digits.startsWith('07')) {
    return `+250${digits.slice(1)}`;
  }

  if (digits.startsWith('7') && digits.length === 9) {
    return `+250${digits}`;
  }

  return `+${digits}`;
};
