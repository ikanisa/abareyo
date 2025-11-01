export const maskMsisdn = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");

  if (digits.length < 5) {
    return null;
  }

  const prefixLength = Math.min(3, Math.max(digits.length - 2, 1));
  const suffixLength = Math.min(2, Math.max(digits.length - prefixLength, 1));
  const maskedSegmentLength = Math.max(digits.length - prefixLength - suffixLength, 2);

  const prefix = digits.slice(0, prefixLength);
  const suffix = digits.slice(digits.length - suffixLength);
  const mask = "*".repeat(maskedSegmentLength);

  const masked = `${prefix}${mask}${suffix}`;
  return hasPlus ? `+${masked}` : masked;
};
