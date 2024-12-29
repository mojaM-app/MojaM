import { Event } from '@events';
import { IUserDto } from '../interfaces/IUser.dto';

export class UserActivatedEvent extends Event {
  public readonly user: IUserDto;

  public constructor(user: IUserDto, currentUserId: number | undefined) {
    super(currentUserId);
    this.user = user;
  }
}
