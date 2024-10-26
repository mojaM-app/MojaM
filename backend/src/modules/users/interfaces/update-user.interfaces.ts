export interface IUpdateUserPassword {
  password: string;
  salt: string;
  emailConfirmed: boolean;
  failedLoginAttempts: number;
}

export interface IUpdateUser {
  isActive?: boolean;
  failedLoginAttempts?: number;
  isLockedOut?: boolean;
  lastLoginAt?: Date;
}

export type TUpdateUser = IUpdateUser | IUpdateUserPassword;
