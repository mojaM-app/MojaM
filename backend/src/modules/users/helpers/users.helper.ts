import { AuthenticationTypes } from '@modules/auth';
import { IUserDto } from '@modules/users';
import { User } from '@modules/users/entities/user.entity';

export function userToIUser(user: User): IUserDto {
  return {
    id: user.uuid,
    email: user.email,
    phone: user.phone,
  } satisfies IUserDto;
}

export function getAuthenticationType(authData: { password?: string | null; pin?: string | null }): AuthenticationTypes | undefined {
  if ((authData.password?.length ?? 0) > 0) {
    return AuthenticationTypes.Password;
  } else if ((authData.pin?.length ?? 0) > 0) {
    return AuthenticationTypes.Pin;
  } else {
    return undefined;
  }
}
