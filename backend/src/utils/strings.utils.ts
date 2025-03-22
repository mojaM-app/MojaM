import { isNullOrUndefined } from './object.utils';

const isString = (value: any): boolean => {
  return typeof value === 'string';
};

const isEmptyString = (value: any): boolean => {
  return isString(value) && value.length === 0;
};

/**
 * Check if value is null or undefined or empty string
 * @param value input value
 * @returns return false if value is null or undefined or empty string '', otherwise return true
 */
const isNullOrEmptyString = (value: any): boolean => {
  return isNullOrUndefined(value) || isEmptyString(value);
};

export { isEmptyString, isNullOrEmptyString, isString };
