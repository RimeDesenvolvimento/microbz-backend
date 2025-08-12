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
