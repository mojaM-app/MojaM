import { Event } from '@events';
import { IHasGuidId } from '@interfaces';
import { IUser } from '@modules/users';

export class UserLockedOutEvent extends Event {
  public readonly user: IUser & IHasGuidId;

  public constructor(user: IUser & IHasGuidId) {
    super();
    this.user = user;
  }
}
