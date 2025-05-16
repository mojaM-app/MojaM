import { IUser } from '@core';
import { AuthenticationTypes } from '@modules/auth';

export interface IResetPasscodeEmailSettings {
  user: IUser;
  authType: AuthenticationTypes;
  link: string;
}
