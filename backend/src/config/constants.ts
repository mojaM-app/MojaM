import { IsStrongPasswordOptions } from 'class-validator';
import { CountryCode } from 'libphonenumber-js';

export const REGEX_PATTERNS = {
  GUID: '[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}',
  INT: '\\d+',
  PHONE: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{3})$/,
  ALPHANUMERIC_ONE_CHAR: /^[a-zA-Z0-9]$/,
  PIN: /^[a-zA-Z0-9]{4}$/,
};
/*
 * Constants used in the application
 * If you want to change the value of any constant, do it here
 * Remember to update the same constant in the frontend application (file frontend/src/core/consts.ts) and in the database
 * Also, remember to update the same values in the translation files
 */
export const VALIDATOR_SETTINGS: {
  EMAIL_MAX_LENGTH: number;
  PASSWORD_MAX_LENGTH: number;
  STRONG_PASSWORD_OPTIONS: IsStrongPasswordOptions;
  PHONE_MAX_LENGTH: number;
  PHONE_COUNTRY_CODE: CountryCode;
  PIN_LENGTH: number;
  NAME_MAX_LENGTH: number;
  ANNOUNCEMENTS_TITLE_MAX_LENGTH: number;
  ANNOUNCEMENT_ITEM_CONTENT_MAX_LENGTH: number;
} = {
  EMAIL_MAX_LENGTH: 100,
  PASSWORD_MAX_LENGTH: 50,
  // If you change the STRONG_PASSWORD_OPTIONS, remember to update messages in the translation files
  STRONG_PASSWORD_OPTIONS: {
    minLength: 9,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 0,
    minSymbols: 0,
  } satisfies IsStrongPasswordOptions,
  PHONE_MAX_LENGTH: 16,
  PHONE_COUNTRY_CODE: 'PL',
  PIN_LENGTH: 4,

  NAME_MAX_LENGTH: 250, // max length for: first name, last name

  ANNOUNCEMENTS_TITLE_MAX_LENGTH: 255,
  ANNOUNCEMENT_ITEM_CONTENT_MAX_LENGTH: 20_000,
};

export const USER_ACCOUNT_LOCKOUT_SETTINGS: {
  FAILED_LOGIN_ATTEMPTS: number;
} = {
  FAILED_LOGIN_ATTEMPTS: 3, // how many times each user can specify the wrong password before the lockout occurs
};
