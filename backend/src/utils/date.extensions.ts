export {};

declare global {
  interface Date {
    addMonths(months: number): Date;
    addDays(days: number): Date;
  }
}

Date.prototype.addMonths = function (months: number): Date {
  if (months === null || months === undefined || months === 0) {
    return this;
  }

  const date = this as Date;
  const newDate = new Date(new Date(date).setMonth(date.getMonth() + months));
  const oneMinuteInMilliseconds = 60 * 1000;
  return new Date(
    newDate.getTime() + (date.getTimezoneOffset() - newDate.getTimezoneOffset()) * oneMinuteInMilliseconds,
  );
};

Date.prototype.addDays = function (days: number): Date {
  if (days === null || days === undefined || days === 0) {
    return this;
  }

  const date = this as Date;
  const newDate = new Date(new Date(date).setDate(date.getDate() + days));
  const oneMinuteInMilliseconds = 60 * 1000;
  return new Date(
    newDate.getTime() + (date.getTimezoneOffset() - newDate.getTimezoneOffset()) * oneMinuteInMilliseconds,
  );
};
