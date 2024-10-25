import { IUserDto } from './get-user.interfaces';

export interface IUserProfileDto extends IUserDto {
  firstName?: string | null;
  lastName?: string | null;
}
