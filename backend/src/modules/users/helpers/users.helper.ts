import { IUserDto, IUserGridItemDto, IUserProfileDto } from '@modules/users';
import { User } from '@modules/users/entities/user.entity';

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

export function userToIUserGridItemDto(user: User): IUserGridItemDto {
  return {
    id: user.uuid,
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
  } satisfies IUserGridItemDto;
}
