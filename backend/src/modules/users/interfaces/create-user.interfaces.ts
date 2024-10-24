export interface ICreateUser {
  email: string;
  phone: string;
  password: string | null;
  isActive: boolean;
  salt: string;
  refreshTokenKey: string;
  isLockedOut: boolean;
  emailConfirmed: boolean;
  phoneConfirmed: boolean;
  lastLoginAt?: Date;
  failedLoginAttempts: number;
}
