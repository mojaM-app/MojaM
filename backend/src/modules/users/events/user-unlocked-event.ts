import { IUser } from '@core';
import { IHasGuidId } from '@core';
import { Event } from '@events';

export class UserUnlockedEvent extends Event {
  public readonly user: IUser & IHasGuidId;

  constructor(user: IUser & IHasGuidId, currentUserId: number | undefined) {
    super(currentUserId);
    this.user = user;
  }
}
