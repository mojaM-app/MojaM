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

// Normalize email: trim and lowercase; return null when input is not a non-empty string
const normalizeEmail = (value: unknown): string | null => {
  if (!isString(value)) {
    return null;
  }
  const trimmed = (value as string).trim();
  if (trimmed.length === 0) {
    return null;
  }
  return trimmed.toLowerCase();
};

// Normalize phone: trim and remove spaces, hyphens and parentheses; keep leading '+' and digits
// Return null when input is not a non-empty string
const normalizePhone = (value: unknown): string | null => {
  if (!isString(value)) {
    return null;
  }
  const trimmed = (value as string).trim();
  if (trimmed.length === 0) {
    return null;
  }
  // remove spaces, hyphens and parentheses
  return trimmed.replace(/[\s\-()]/gu, '');
};

export { isEmptyString, isNullOrEmptyString, isString, normalizeEmail, normalizePhone };
