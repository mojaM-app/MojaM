import { IUser } from '@modules/users';

export interface IUnlockAccountEmailSettings {
  user: IUser;
  link: string;
  lockDateTime: Date;
}
