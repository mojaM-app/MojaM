import { IUser } from '@modules/users';

export interface IWelcomeEmailSettings {
  user: IUser;
  link: string;
}
