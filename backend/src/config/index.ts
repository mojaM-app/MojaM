import { config } from 'dotenv';
config({ path: `.env.${process.env.NODE_ENV ?? 'development'}.local` });

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const {
  NODE_ENV,
  PORT,
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  SECRET_AUDIENCE,
  SECRET_ISSUER,
  REFRESH_TOKEN_EXPIRE_IN,
  LOG_FORMAT,
  LOG_DIR,
  ORIGIN,
  BASE_PATH,
} = process.env;
