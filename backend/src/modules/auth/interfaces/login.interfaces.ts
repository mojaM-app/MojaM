import { IUserDto } from '@modules/users';

export interface ILoginResult {
  user: IUserDto;
  accessToken: string;
  refreshToken: string;
}
