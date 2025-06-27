import { type IUserId } from '../users/IUser.Id';

export interface ICreateResetPasscodeToken {
  user: IUserId;
  token: string;
}
