/* eslint-disable @typescript-eslint/no-unsafe-argument */

const isDate = (date: any): boolean => {
  return date !== null && date !== undefined && date instanceof Date && !isNaN(date?.getTime());
};

const getDateTimeNow = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());
};

const getDateNow = (): Date => {
  const now = new Date();
  return new Date(now.toISOString().slice(0, 10));
};

export { getDateNow, getDateTimeNow, isDate };
