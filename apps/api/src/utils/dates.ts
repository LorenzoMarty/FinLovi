export function getPeriodRange(period: string) {
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
