import { cleanEnv, email, port, str, url } from 'envalid';

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
    REFRESH_TOKEN_EXPIRE_IN: str({ default: '1d' }), // Default to 1 day

    CLIENT_APP_URL: url(),

    SMTP_SERVICE_HOST: str(),
    SMTP_SERVICE_PORT: port(),
    SMTP_USER_NAME: str(),
    SMTP_USER_PASSWORD: str(),

    TPL_VAR_APP_NAME: str(),
    TPL_VAR_CONTACT_EMAIL: email(),
    TPL_VAR_CONTACT_PHONE: str(),
    TPL_VAR_CONTACT_WEBSITE: str(),
    TPL_VAR_RESET_PASSWORD_TITLE: str(),
    TPL_VAR_RESET_PIN_TITLE: str(),
    TPL_VAR_WELCOME_EMAIL_TITLE: str(),
    TPL_VAR_ACCOUNT_BLOCKED_EMAIL_TITLE: str(),

    NOTIFICATIONS_EMAIL: email(),
    RESET_PASSWORD_TOKEN_EXPIRE_IN: str({ default: '1h' }), // Default to 1 hour

    // Security configuration
    SECURITY_REQUEST_ID_HEADER: str({ default: 'X-Request-ID' }),
    SECURITY_LOG_FAILED_REQUESTS: str({ default: 'true' }),
    SECURITY_CSP_REPORT_URI: str({ default: '/security/csp-report' }),

    ADMIN_EMAIL: email(),
    ADMIN_PASSWORD: str(),
    ADMIN_UUID: str(),

    // Logging configuration
    LOG_LEVEL: str({ default: 'warn', choices: ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'] }),
  });
};
