import { config } from 'dotenv';

function getEnvName(NODE_ENV: string | undefined): string {
  if (NODE_ENV === 'production') {
    return 'production';
  }

  return 'development';
}

config({ path: `.env.${getEnvName(process.env.NODE_ENV)}.local` });

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const {
  NODE_ENV,
  PORT,
  BASE_PATH,

  DATABASE_HOST,
  DATABASE_PORT,
  DATABASE_USERNAME,
  DATABASE_PASSWORD,
  DATABASE_NAME,
  DATABASE_MIGRATIONS_PATH,

  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  SECRET_AUDIENCE,
  SECRET_ISSUER,
  REFRESH_TOKEN_EXPIRE_IN,

  CLIENT_APP_URL,
  COMMUNITY_INFO_URL,

  SMTP_SERVICE_HOST,
  SMTP_SERVICE_PORT,
  SMTP_USER_NAME,
  SMTP_USER_PASSWORD,

  TPL_VAR_APP_NAME,
  TPL_VAR_CONTACT_EMAIL,
  TPL_VAR_CONTACT_PHONE,
  TPL_VAR_CONTACT_WEBSITE,
  TPL_VAR_RESET_PASSWORD_TITLE,
  TPL_VAR_RESET_PIN_TITLE,
  TPL_VAR_WELCOME_EMAIL_TITLE,
  TPL_VAR_ACCOUNT_BLOCKED_EMAIL_TITLE,

  NOTIFICATIONS_EMAIL,
  RESET_PASSWORD_TOKEN_EXPIRE_IN,

  GOOGLE_API_CLIENT_ID,
  GOOGLE_API_CLIENT_SECRET,
  GOOGLE_API_REFRESH_TOKEN,

  GOOGLE_CALENDAR_ID,

  LOG_FORMAT,
  LOG_DIR,

  ORIGIN,

  ADMIN_EMAIL,
  ADMIN_PASSWORD,
} = process.env;
export { REGEX_PATTERNS, USER_ACCOUNT_LOCKOUT_SETTINGS, VALIDATOR_SETTINGS } from './constants';
export { ValidateEnv } from './validateEnv';
export let exportsForTesting: any;
if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
  exportsForTesting = { getEnvName };
}
