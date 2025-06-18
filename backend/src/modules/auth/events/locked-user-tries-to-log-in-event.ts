import { Event, IUser } from '@core';

export class LockedUserTriesToLogInEvent extends Event {
  public readonly user: IUser;

  constructor(user: IUser) {
    super();
    this.user = user;
  }
}
