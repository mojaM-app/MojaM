import { IUser } from './IUser';

export interface IUserProfile extends IUser {
  firstName?: string;
  lastName?: string;
}
