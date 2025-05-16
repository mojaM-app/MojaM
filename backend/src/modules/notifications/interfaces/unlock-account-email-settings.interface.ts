import { IUser } from '@core';

export interface IUnlockAccountEmailSettings {
  user: IUser;
  link: string;
  lockDateTime: Date;
}
