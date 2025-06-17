import { IUser, Event } from '@core';

export class UserPasscodeChangedEvent extends Event {
  public readonly user: IUser;

  constructor(user: IUser) {
    super();
    this.user = user;
  }
}
