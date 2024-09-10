import { IUserDto } from '@modules/users';

export type TLoginResult = IUserDto & {
  accessToken: string;
  refreshToken: string;
};
