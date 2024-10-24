import { IUserId } from '@interfaces';

export interface ICreateResetPasswordToken {
  user: IUserId;
  token: string;
}
