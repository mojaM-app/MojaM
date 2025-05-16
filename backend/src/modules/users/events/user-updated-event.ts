import { IUser } from '@core';
import { Event } from '@events';
import { IHasGuidId } from '@interfaces';

export class UserUpdatedEvent extends Event {
  public readonly user: IUser & IHasGuidId;

  constructor(user: IUser & IHasGuidId, currentUserId: number | undefined) {
    super(currentUserId);
    this.user = user;
  }
}
