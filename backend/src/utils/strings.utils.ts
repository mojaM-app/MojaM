import { isNullOrUndefined } from './object.utils';

const isString = (value: unknown): boolean => {
  return typeof value === 'string';
};

const isEmptyString = (value: unknown): boolean => {
  return isString(value) && (value as string).length === 0;
};

/**
 * Check if value is null or undefined or empty string
 * @param value input value
 * @returns return false if value is null or undefined or empty string '', otherwise return true
 */
const isNullOrEmptyString = (value: unknown): boolean => {
  return isNullOrUndefined(value) || isEmptyString(value);
};

export { isEmptyString, isNullOrEmptyString, isString };
