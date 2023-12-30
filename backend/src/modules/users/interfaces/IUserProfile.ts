import { IUser } from '@modules/users/interfaces/IUser';

export interface IUserProfile extends IUser {
  firstName?: string;
  lastName?: string;
}
