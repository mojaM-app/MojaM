import { IUser } from '@modules/users';

export interface ILoginResult {
  user: IUser;
  accessToken: string;
  refreshToken: string;
}
