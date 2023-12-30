import { IUser } from '@modules/users/interfaces/IUser';
import { IUserProfile } from '@modules/users/interfaces/IUserProfile';
import { User } from '@prisma/client';

export default class UsersHelper {
  public static UserToIUser(user: User): IUser {
    return <IUser>{
      uuid: user.uuid,
      email: user.email,
      phone: user.phone,
    };
  }

  public static UserToIUserProfile(user: User): IUserProfile {
    return <IUserProfile>{
      uuid: user.uuid,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
