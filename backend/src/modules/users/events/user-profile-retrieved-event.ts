import { Event } from '@events';
import { IUserProfileDto } from '../interfaces/get-user-profile.interfaces';

export class UserProfileRetrievedEvent extends Event {
  public readonly user: IUserProfileDto;

  public constructor(user: IUserProfileDto, currentUserId: number | undefined) {
    super(currentUserId);
    this.user = user;
  }
}
