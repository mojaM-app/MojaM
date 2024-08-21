import { IUser } from '@modules/users';

export type TLoginResult = IUser & {
  accessToken: string;
  refreshToken: string;
};
