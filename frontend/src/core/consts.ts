export const VALIDATOR_SETTINGS = {
  EMAIL_MAX_LENGTH: 100,
  PHONE_MAX_LENGTH: 16,
  NAME_MAX_LENGTH: 250, // max length for: first name, last name

  PASSWORD_MAX_LENGTH: 50,
  STRONG_PASSWORD_OPTIONS: {
    minLength: 9,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 0,
    minSymbols: 0,
  },
  PIN_LENGTH: 4,

  ANNOUNCEMENTS_TITLE_MAX_LENGTH: 255,
  ANNOUNCEMENT_ITEM_CONTENT_MAX_LENGTH: 20000,

  BULLETIN_TITLE_MAX_LENGTH: 500,
  BULLETIN_INTRODUCTION_MAX_LENGTH: 4000,
  BULLETIN_DAY_SECTION_CONTENT_MAX_LENGTH: 20000,
};

export const REGEX_PATTERNS = {
  PHONE: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{3})$/,
  PIN: /^[a-zA-Z0-9]{4}$/,
  ALPHANUMERIC_ONE_CHAR: /^[a-zA-Z0-9]$/,
};
