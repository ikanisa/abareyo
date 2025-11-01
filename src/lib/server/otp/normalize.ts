const DEFAULT_COUNTRY_CODE = process.env.OTP_DEFAULT_COUNTRY_CODE ?? "";

export const normalizePhoneNumber = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) {
    return "";
  }
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (hasPlus) {
    return digits.length ? `+${digits}` : "";
  }
  if (digits.length >= 6) {
    const country = DEFAULT_COUNTRY_CODE.replace(/\D/g, "");
    if (country) {
      if (digits.startsWith(country)) {
        return `+${digits}`;
      }
      return `+${country}${digits}`;
    }
    return `+${digits}`;
  }
  return "";
};
