const isDate = (date: unknown): boolean => {
  return date !== null && date !== undefined && date instanceof Date && !isNaN(date.getTime());
};

const getDateTimeNow = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());
};

const getDateNow = (): Date => {
  const now = new Date();
  const datePartLength = 10; // YYYY-MM-DD format length
  return new Date(now.toISOString().slice(0, datePartLength));
};

const getMonthBounds = (date: Date = new Date()): { firstDay: Date; lastDay: Date } => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { firstDay, lastDay };
};

const minDate = (dates: (Date | null | undefined)[]): Date | null => {
  const validDates = dates.filter((d): d is Date => d instanceof Date && !isNaN(d.getTime()));
  if (validDates.length === 0) return null;

  return validDates.reduce((min, curr) => (curr < min ? curr : min));
};

const maxDate = (dates: (Date | null | undefined)[]): Date | null => {
  const validDates = dates.filter((d): d is Date => d instanceof Date && !isNaN(d.getTime()));
  if (validDates.length === 0) return null;

  return validDates.reduce((max, curr) => (curr > max ? curr : max));
};

export { getDateNow, getDateTimeNow, isDate, getMonthBounds, minDate, maxDate };
