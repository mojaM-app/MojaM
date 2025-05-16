import { IUserDto } from '@core';

export interface IUserDetailsDto extends IUserDto {
  firstName: string | null;
  lastName: string | null;
  joiningDate: Date | null;
  lastLoginAt: Date | null;
  isActive: boolean;
  isLockedOut: boolean;
  permissionCount: number;
}
