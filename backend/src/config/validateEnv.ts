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

    // Rate limiting configuration
    RATE_LIMIT_AUTH_WINDOW_MS: num({ default: 900000 }), // 15 minutes
    RATE_LIMIT_AUTH_MAX_ATTEMPTS: num({ default: 5 }),
    RATE_LIMIT_GENERAL_WINDOW_MS: num({ default: 900000 }), // 15 minutes
    RATE_LIMIT_GENERAL_MAX_REQUESTS: num({ default: 100 }),
    RATE_LIMIT_PASSWORD_RESET_WINDOW_MS: num({ default: 3600000 }), // 1 hour
    RATE_LIMIT_PASSWORD_RESET_MAX_ATTEMPTS: num({ default: 3 }),

    // Security configuration
    SECURITY_REQUEST_ID_HEADER: str({ default: 'X-Request-ID' }),
    SECURITY_LOG_FAILED_REQUESTS: str({ default: 'true' }),
    SECURITY_CSP_REPORT_URI: str({ default: '/security/csp-report' }),

    ADMIN_EMAIL: email(),
    ADMIN_PASSWORD: str(),
    ADMIN_UUID: str(),
  });
};
