const toUtcDate = (date: Date | null | undefined): Date | null => {
  if (!isDate(date)) {
    return null;
  }

  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0));
};

const isDate = (date: any): boolean => {
  return date !== null && date !== undefined && date instanceof Date && !isNaN(date?.getTime());
}

export { isDate, toUtcDate };
