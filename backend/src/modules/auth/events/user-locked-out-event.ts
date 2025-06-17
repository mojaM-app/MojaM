import { IUser, Event, IHasGuidId } from '@core';

export class UserLockedOutEvent extends Event {
  public readonly user: IUser & IHasGuidId;

  constructor(user: IUser & IHasGuidId) {
    super();
    this.user = user;
  }
}
