import { IUserDto } from '@modules/users';
import { User } from '@modules/users/entities/user.entity';

export function userToIUser(user: User): IUserDto {
  return {
    id: user.uuid,
    email: user.email,
    phone: user.phone,
  } satisfies IUserDto;
}
