import { Event } from '@events';
import { IUserDto } from '../interfaces/get-user.interfaces';

export class UserDeactivatedEvent extends Event {
  public readonly user: IUserDto;

  public constructor(user: IUserDto, currentUserId: number | undefined) {
    super(currentUserId);
    this.user = user;
  }
}
