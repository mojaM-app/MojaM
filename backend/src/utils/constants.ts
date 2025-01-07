import { IsStrongPasswordOptions } from 'class-validator';
import { CountryCode } from 'libphonenumber-js';

export const REGEX_GUID_PATTERN = '[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}';
export const REGEX_INT_PATTERN = '\\d+';

export const VALIDATOR_SETTINGS: {
  EMAIL_MAX_LENGTH: number;
  PASSWORD_MAX_LENGTH: number;
  STRONG_PASSWORD_OPTIONS: IsStrongPasswordOptions;
  PHONE_MAX_LENGTH: number;
  PHONE_COUNTRY_CODE: CountryCode;
  NAME_MAX_LENGTH: number;
  ANNOUNCEMENTS_TITLE_MAX_LENGTH: number;
  ANNOUNCEMENT_ITEM_CONTENT_MAX_LENGTH: number;
} = {
  EMAIL_MAX_LENGTH: 100,
  PASSWORD_MAX_LENGTH: 50,
  STRONG_PASSWORD_OPTIONS: {
    minLength: 9,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 0,
    minSymbols: 0,
  } satisfies IsStrongPasswordOptions,
  PHONE_MAX_LENGTH: 16,
  PHONE_COUNTRY_CODE: 'PL',

  NAME_MAX_LENGTH: 250, // max length for first name and last name

  ANNOUNCEMENTS_TITLE_MAX_LENGTH: 255,
  ANNOUNCEMENT_ITEM_CONTENT_MAX_LENGTH: 20_000,
};

export const USER_ACCOUNT_LOCKOUT_SETTINGS: {
  FAILED_LOGIN_ATTEMPTS: number;
} = {
  FAILED_LOGIN_ATTEMPTS: 3, // how many times each user can specify the wrong password before the lockout occurs
  // Users_Locked_Out_For: 15, // how many minutes each user is locked out
};
