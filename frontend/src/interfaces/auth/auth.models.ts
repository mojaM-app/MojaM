import { IUser } from '../users/user.interfaces';

export interface IAccountBeforeLogInDto {
  isPhoneRequired?: boolean;
  isActive?: boolean;
  isPasswordSet?: boolean;
}

export interface IResetPasswordResultDto {
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
