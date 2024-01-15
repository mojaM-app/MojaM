/* eslint-disable @typescript-eslint/no-unsafe-argument */
const toUtcDate = (date: any): Date | null => {
  if (!isDate(date)) {
    return null;
  }

  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0));
};

const isDate = (date: any): boolean => {
  return date !== null && date !== undefined && date instanceof Date && !isNaN(date?.getTime());
}

const getUtcNow = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds(),));
}

export { getUtcNow, isDate, toUtcDate };
