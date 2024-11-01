/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable no-extend-native */
/* eslint-disable @typescript-eslint/method-signature-style */
export { };

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
  return new Date(newDate.getTime() + (date.getTimezoneOffset() - newDate.getTimezoneOffset()) * 60 * 1000);
};

Date.prototype.addDays = function (days: number): Date {
  if (days === null || days === undefined || days === 0) {
    return this;
  }

  const date = this as Date;
  const newDate = new Date(new Date(date).setDate(date.getDate() + days));
  return new Date(newDate.getTime() + (date.getTimezoneOffset() - newDate.getTimezoneOffset()) * 60 * 1000);
};
