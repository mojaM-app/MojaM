import { IUser } from '@core';
import { Event } from '@events';

export class LockedUserTriesToLogInEvent extends Event {
  public readonly user: IUser;

  constructor(user: IUser) {
    super();
    this.user = user;
  }
}
