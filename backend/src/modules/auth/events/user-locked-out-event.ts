import { IUser } from '@core';
import { IHasGuidId } from '@core';
import { Event } from '@events';

export class UserLockedOutEvent extends Event {
  public readonly user: IUser & IHasGuidId;

  constructor(user: IUser & IHasGuidId) {
    super();
    this.user = user;
  }
}
