import { type IUserDto } from '../users/IUser.dto';

export type TLoginResult = IUserDto & {
  accessToken: string;
  refreshToken: string;
};
