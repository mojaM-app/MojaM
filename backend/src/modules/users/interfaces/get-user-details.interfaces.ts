import { IUserProfileDto } from './get-user-profile.interfaces';

export interface IUserDetailsDto extends IUserProfileDto {
  lastLoginAt: Date | null;
  isActive: boolean;
  isLockedOut: boolean;
  rolesCount: number;
}
