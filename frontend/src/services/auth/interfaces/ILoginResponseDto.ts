import { IUser } from '../../../interfaces/users/user.interfaces';

export interface ILoginResponseDto extends IUser {
  accessToken?: string;
  refreshToken?: string;
}
