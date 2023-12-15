import { IsStrongPasswordOptions } from 'class-validator';
import { CountryCode } from 'libphonenumber-js';

export const REGEX_GUID_PATTERN = '[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}';
export const REGEX_INT_PATTERN = '\\d+';

export const VALIDATOR_SETTINGS: {
  EMAIL_MAX_LENGTH: number;
  PASSWORD_MAX_LENGTH: number;
  IS_STRONG_PASSWORD_OPTIONS: IsStrongPasswordOptions;
  PHONE_MAX_LENGTH: number;
  PHONE_COUNTRY_CODE: CountryCode;
} = {
  EMAIL_MAX_LENGTH: 100,
  PASSWORD_MAX_LENGTH: 50,
  IS_STRONG_PASSWORD_OPTIONS: <IsStrongPasswordOptions>{
    minLength: 9,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 0,
    minSymbols: 0,
  },
  PHONE_MAX_LENGTH: 16,
  PHONE_COUNTRY_CODE: 'PL',
};
