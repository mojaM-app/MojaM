import { cleanEnv, email, num, port, str, url } from 'envalid';

export const ValidateEnv = (): void => {
  cleanEnv(process.env, {
    NODE_ENV: str(),
    PORT: port(),

    DATABASE_HOST: str(),
    DATABASE_PORT: port(),
    DATABASE_USERNAME: str(),
    DATABASE_PASSWORD: str(),
    DATABASE_NAME: str(),
    DATABASE_MIGRATIONS_PATH: str(),

    ACCESS_TOKEN_SECRET: str(),
    REFRESH_TOKEN_SECRET: str(),
    SECRET_AUDIENCE: str(),
    SECRET_ISSUER: str(),
    REFRESH_TOKEN_EXPIRE_IN: str(),

    CLIENT_APP_URL: url(),

    SMTP_SERVICE_HOST: str(),
    SMTP_SERVICE_PORT: port(),
    SMTP_USER_NAME: str(),
    SMTP_USER_PASSWORD: str(),

    NOTIFICATIONS_EMAIL: email(),
    REQ_RESET_PASSWORD_TITLE: str(),
    RESET_PASSWORD_TOKEN_EXPIRE_IN: num(),
  });
};
