import { IUser } from '@core';

export interface IWelcomeEmailSettings {
  user: IUser;
  link: string;
}
