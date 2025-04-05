import { AuthenticationTypes } from '@modules/auth';
import { IUser } from '@modules/users';

export interface IResetPasscodeEmailSettings {
  user: IUser;
  authType: AuthenticationTypes;
  link: string;
}
