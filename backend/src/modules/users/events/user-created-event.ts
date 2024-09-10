import { Event } from '@events';
import { IUserDto } from '../dtos/get-user-profile.dto';

export class UserCreatedEvent extends Event {
  public readonly user: IUserDto;

  public constructor(user: IUserDto, currentUserId: number | undefined) {
    super(currentUserId);
    this.user = user;
  }
}
