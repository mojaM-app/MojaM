import { IUser } from '../../../core/interfaces/users/user.interfaces';

export interface ILoginResponseDto extends IUser {
  accessToken?: string;
  refreshToken?: string;
}
