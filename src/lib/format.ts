const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 2,
});

const shortDate = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
});

const longDate = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

export function formatCurrency(value: number) {
  return currency.format(value || 0);
}

export function formatShortDate(value?: string) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return shortDate.format(date);
}

export function formatLongDate(value?: string | null) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return longDate.format(date);
}

export function formatPercent(value: number, showSign = true) {
  const sign = showSign ? (value > 0 ? '+' : value < 0 ? '-' : '') : '';
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.abs(value));
  return `${sign}${formatted}%`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 2,
  }).format(value || 0);
}
