import { Event } from '@events';
import { IUserDto } from '@modules/users';

export class UserLockedOutEvent extends Event {
  public readonly user: IUserDto;

  public constructor(user: IUserDto) {
    super();
    this.user = user;
  }
}
