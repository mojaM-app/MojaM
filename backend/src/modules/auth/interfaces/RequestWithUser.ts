import { IUser } from '@modules/users/interfaces/IUser';
import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: IUser;
}
