import { IUser } from '../users/user.interfaces';
import { AuthenticationTypes } from './../../app/components/static/activate-account/enums/authentication-type.enum';

export interface IAccountBeforeLogInDto {
  isPhoneRequired?: boolean;
  isActive?: boolean;
  authType?: AuthenticationTypes;
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
