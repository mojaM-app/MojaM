import { Event } from '@events';
import { IGetUserDto } from '../interfaces/get-user.interfaces';

export class UserRetrievedEvent extends Event {
  public readonly user: IGetUserDto;

  public constructor(user: IGetUserDto, currentUserId: number | undefined) {
    super(currentUserId);
    this.user = user;
  }
}
