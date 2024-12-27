import { IUserDto, IUserProfileDto } from '@modules/users';
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
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    joiningDate: user.joiningDate ?? null,
  } satisfies IUserProfileDto;
}
