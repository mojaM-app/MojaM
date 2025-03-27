import { IUserId } from '@modules/users';

export interface ICreateResetPasscodeToken {
  user: IUserId;
  token: string;
}
