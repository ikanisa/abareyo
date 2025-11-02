type NumberFormatOptions = Intl.NumberFormatOptions & { fallback?: (value: number) => string };

const toNumberFormatter = (value: number, locale: string | string[] | undefined, options?: NumberFormatOptions) => {
  try {
    return new Intl.NumberFormat(locale, options).format(value);
  } catch {
    if (typeof options?.fallback === "function") {
      return options.fallback(value);
    }
    return value.toLocaleString(typeof locale === "string" ? locale : undefined);
  }
};

export const formatNumber = (value: number, locale?: string, options?: NumberFormatOptions) =>
  toNumberFormatter(value, locale, options);

export const formatCurrency = (value: number, currency = "RWF", locale?: string) =>
  toNumberFormatter(value, locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    fallback: (amount) => `${amount.toLocaleString(locale)} ${currency}`,
  });

export const formatDateTime = (
  input: Date | string | number,
  locale?: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" },
) => {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch {
    return date.toLocaleString(locale, options as Intl.DateTimeFormatOptions);
  }
};

export const percentage = (value: number, total: number) => {
  if (!total) return 0;
  return Math.round((value / total) * 100);
};
