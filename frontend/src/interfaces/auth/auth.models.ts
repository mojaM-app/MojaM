import { IUser } from '../users/user.interfaces';

export interface IUserInfoBeforeLogInDto {
  isPhoneRequired?: boolean;
  isActive?: boolean;
  isPasswordSet?: boolean;
}

export interface CheckResetPasswordTokenResult {
  isValid: boolean;
  userEmail?: string;
}

export interface ResetPasswordResultDto {
  isPasswordSet: boolean;
}

export interface ILoginModel {
  email: string;
  phone?: string;
  password: string;
}

export interface ILoginResponse extends IUser {
  accessToken?: string;
  refreshToken?: string;
}
