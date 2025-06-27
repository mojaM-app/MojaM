export const toBoolean = (value: unknown): boolean => {
  return value === 1 || value === true || value === 'true' || value === '1';
};
