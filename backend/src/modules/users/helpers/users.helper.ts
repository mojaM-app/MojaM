import { User } from '../entities/user.entity';
import { IUserDto } from '../interfaces/IUser.dto';

export function userToIUser(user: User): IUserDto {
  return {
    id: user.uuid,
    email: user.email,
    phone: user.phone,
  } satisfies IUserDto;
}
