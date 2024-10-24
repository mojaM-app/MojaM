import { IUserId } from '@modules/users';

export interface ICreateResetPasswordToken {
  user: IUserId;
  token: string;
}
