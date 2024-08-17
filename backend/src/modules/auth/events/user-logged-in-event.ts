import { Event } from '@events';
import { IUser } from '@modules/users';

export class UserLoggedInEvent extends Event {
  public readonly user: IUser;

  public constructor(user: IUser) {
    super();
    this.user = {
      uuid: user?.uuid,
      email: user?.email,
      phone: user?.phone,
    } satisfies IUser;
  }
}
