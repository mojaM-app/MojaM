import { Event } from '@events';
import { IUserDetailsDto } from '../dtos/get-user-details.dto';

export class UserDetailsRetrievedEvent extends Event {
  public readonly user: IUserDetailsDto;

  constructor(user: IUserDetailsDto, currentUserId: number | undefined) {
    super(currentUserId);
    this.user = user;
  }
}
