import { IUser } from '../users/user.interfaces';

export interface UserWhoLogsInResult {
  isLoginSufficientToLogIn: boolean;
  isPasswordSet?: boolean;
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
