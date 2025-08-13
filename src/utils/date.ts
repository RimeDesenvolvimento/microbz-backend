export function getWeeksInMonth(
  startDate: Date,
  endDate: Date
): Array<{ start: Date; end: Date }> {
  const weeks: Array<{ start: Date; end: Date }> = [];
  const totalDays = endDate.getDate();
  const daysPerWeek = Math.ceil(totalDays / 4);

  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(1 + i * daysPerWeek);

    const weekEnd = new Date(startDate);
    weekEnd.setDate(Math.min(totalDays, (i + 1) * daysPerWeek));

    if (i === 3) {
      weekEnd.setDate(totalDays);
    }

    weeks.push({ start: weekStart, end: weekEnd });
  }

  return weeks;
}

export function parseYMDToLocalDate(dateStr: string, endOfDay = false): Date {
  const [y, m, d] = (dateStr || '').split('-').map(Number);
  if (!y || !m || !d) {
    throw new Error('Formato de data inválido. Use YYYY-MM-DD');
  }

  return endOfDay
    ? new Date(y, m - 1, d, 23, 59, 59, 999)
    : new Date(y, m - 1, d, 0, 0, 0, 0);
}
