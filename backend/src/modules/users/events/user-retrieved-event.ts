import { Event } from '@events';
import { IUserProfileDto } from '../dtos/get-user-profile.dto';

export class UserRetrievedEvent extends Event {
  public readonly user: IUserProfileDto;

  public constructor(user: IUserProfileDto, currentUserId: number | undefined) {
    super(currentUserId);
    this.user = user;
  }
}
