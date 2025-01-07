export interface ICreateUser {
  email: string;
  phone: string;
  firstName?: string | null;
  lastName?: string | null;
  joiningDate?: Date | null;
  password?: string | null;
  isActive: boolean;
  salt: string;
  refreshTokenKey: string;
  isLockedOut: boolean;
  emailConfirmed: boolean;
  phoneConfirmed: boolean;
  lastLoginAt?: Date | null;
  failedLoginAttempts: number;
}
