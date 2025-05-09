import { Event } from '@events';
import { IHasGuidId } from '@interfaces';
import { IUser } from '../interfaces/IUser';

export class UserUnlockedEvent extends Event {
  public readonly user: IUser & IHasGuidId;

  constructor(user: IUser & IHasGuidId, currentUserId: number | undefined) {
    super(currentUserId);
    this.user = user;
  }
}
