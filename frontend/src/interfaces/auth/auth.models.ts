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

export interface ILoginModelDto {
  email: string;
  phone?: string;
  password: string;
}

export interface ILoginResponseDto extends IUser {
  accessToken?: string;
  refreshToken?: string;
}
