export type PeriodKey = 'current' | 'previous' | 'last3';

export function getPeriodRange(period: PeriodKey) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  let end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  if (period === 'previous') {
    start.setMonth(start.getMonth() - 1);
    end = new Date(now.getFullYear(), now.getMonth(), 0);
  } else if (period === 'last3') {
    start.setMonth(start.getMonth() - 2);
  }

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function formatMonthLabel(value: string) {
  const date = new Date(`${value}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' }).format(date);
}
