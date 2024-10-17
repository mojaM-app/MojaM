import { IUserDto, IUserGridItemDto, IUserProfileDto } from '@modules/users';
import { User } from '@modules/users/entities/user.entity';
import { vUser } from '@modules/users/entities/vUser.entity';

export function userToIUser(user: User): IUserDto {
  return {
    id: user.uuid,
    email: user.email,
    phone: user.phone,
  } satisfies IUserDto;
}

export function userToIUserProfile(user: User): IUserProfileDto {
  return {
    id: user.uuid,
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
  } satisfies IUserProfileDto;
}

export function userToIUserGridItemDto(user: vUser): IUserGridItemDto {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
    joiningDate: user.joiningDate,
    lastLoginAt: user.lastLoginAt,
    isActive: user.isActive,
    isLockedOut: user.isLockedOut,
    rolesCount: user.rolesCount,
  } satisfies IUserGridItemDto;
}
