import { IUser } from '@core';
import { Event } from '@events';
import { IHasGuidId } from '@interfaces';

export class UserLockedOutEvent extends Event {
  public readonly user: IUser & IHasGuidId;

  constructor(user: IUser & IHasGuidId) {
    super();
    this.user = user;
  }
}
