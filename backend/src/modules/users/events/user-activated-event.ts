import { Event } from '@events';
import { IUser } from '../interfaces/IUser';

export class UserActivatedEvent extends Event {
  public readonly user: IUser;

  public constructor(user: IUser, currentUserId: number | undefined) {
    super(currentUserId);
    this.user = user;
  }
}
