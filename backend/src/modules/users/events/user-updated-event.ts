import { Event, type IHasGuidId, type IUser } from '@core';

export class UserUpdatedEvent extends Event {
  public readonly user: IUser & IHasGuidId;

  constructor(user: IUser & IHasGuidId, currentUserId: number | undefined) {
    super(currentUserId);
    this.user = user;
  }
}
