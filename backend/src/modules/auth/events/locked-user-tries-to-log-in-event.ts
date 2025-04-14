import { Event } from '@events';
import { IUser } from '@modules/users';

export class LockedUserTriesToLogInEvent extends Event {
  public readonly user: IUser;

  constructor(user: IUser) {
    super();
    this.user = user;
  }
}
