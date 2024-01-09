import { User } from '@db/DbModels';
import { IUser, IUserProfile } from '@modules/users';

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
