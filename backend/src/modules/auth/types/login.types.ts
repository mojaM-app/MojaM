import { IUserDto } from '@core';

export type TLoginResult = IUserDto & {
  accessToken: string;
  refreshToken: string;
};
