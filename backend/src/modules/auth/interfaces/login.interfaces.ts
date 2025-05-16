import { IUserDto } from '@core';

export interface ILoginResult {
  user: IUserDto;
  accessToken: string;
  refreshToken: string;
}
