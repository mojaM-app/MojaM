export interface IUpdateUserPasscode {
  passcode: string;
  salt: string;
  emailConfirmed: boolean;
  failedLoginAttempts: number;
}

export interface IUpdateUser {
  email?: string;
  phone?: string;
  firstName?: string | null;
  lastName?: string | null;
  joiningDate?: Date | null;
  isActive?: boolean;
  failedLoginAttempts?: number;
  isLockedOut?: boolean;
  lastLoginAt?: Date | null;
}

export type TUpdateUser = IUpdateUser | IUpdateUserPasscode;
