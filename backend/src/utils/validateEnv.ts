import { cleanEnv, port, str } from 'envalid';

export const ValidateEnv = (): void => {
  cleanEnv(process.env, {
    NODE_ENV: str(),
    PORT: port(),
    REFRESH_TOKEN_EXPIRE_IN: str(),
    ACCESS_TOKEN_SECRET: str(),
    REFRESH_TOKEN_SECRET: str(),
    SECRET_AUDIENCE: str(),
    SECRET_ISSUER: str(),
  });
};
