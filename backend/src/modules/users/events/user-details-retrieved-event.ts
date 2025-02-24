import { Event } from '@events';
import { IUserDetailsDto } from '../interfaces/user-details.interfaces';

export class UserDetailsRetrievedEvent extends Event {
  public readonly user: IUserDetailsDto;

  public constructor(user: IUserDetailsDto, currentUserId: number | undefined) {
    super(currentUserId);
    this.user = user;
  }
}
