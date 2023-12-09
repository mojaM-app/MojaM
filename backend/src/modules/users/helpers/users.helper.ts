import { User } from '@prisma/client';
import { IUser } from '../interfaces/IUser';

export default class UsersHelper {
  public static UserToIUser(user: User): IUser {
    return <IUser>{
      uuid: user.uuid,
      email: user.email,
      phone: user.phone,
    };
  }
}
