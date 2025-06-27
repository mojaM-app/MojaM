import { Event, type IUser } from '@core';

export class FailedLoginAttemptEvent extends Event {
  public readonly user: IUser;

  constructor(user: IUser) {
    super();
    this.user = user;
  }
}
