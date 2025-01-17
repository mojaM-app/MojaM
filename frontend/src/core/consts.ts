export const VALIDATOR_SETTINGS = {
  EMAIL_MAX_LENGTH: 100,
  PHONE_MAX_LENGTH: 16,
  PASSWORD_MAX_LENGTH: 50,
  STRONG_PASSWORD_OPTIONS: {
    minLength: 9,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 0,
    minSymbols: 0,
  },
  NAME_MAX_LENGTH: 250, // max length for: first name, last name
  ANNOUNCEMENTS_TITLE_MAX_LENGTH: 255,
  ANNOUNCEMENT_ITEM_CONTENT_MAX_LENGTH: 20000,
};
