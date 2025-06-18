import { Event, IHasGuidId, IUser } from '@core';

export class UserCreatedEvent extends Event {
  public readonly user: IUser & IHasGuidId;

  constructor(user: IUser & IHasGuidId, currentUserId: number | undefined) {
    super(currentUserId);
    this.user = user;
  }
}
