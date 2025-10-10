export const formatCurrency = (value: number, currency = "RWF") => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${currency}`;
  }
};

export const percentage = (value: number, total: number) => {
  if (!total) return 0;
  return Math.round((value / total) * 100);
};
