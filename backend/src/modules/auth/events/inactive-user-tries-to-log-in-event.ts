import { Event, type IUser } from '@core';

export class InactiveUserTriesToLogInEvent extends Event {
  public readonly user: IUser;

  constructor(user: IUser) {
    super();
    this.user = user;
  }
}
