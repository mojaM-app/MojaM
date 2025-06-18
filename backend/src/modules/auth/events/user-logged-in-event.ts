import { Event, IUser } from '@core';

export class UserLoggedInEvent extends Event {
  public readonly user: IUser;

  constructor(user: IUser) {
    super();
    this.user = user;
  }
}
