import { IUser } from '@modules/users';

export interface LoginResult {
  user: IUser;
  accessToken: string;
  refreshToken: string;
}

export type TLoginResult = IUser & {
  accessToken: string;
  refreshToken: string;
};
