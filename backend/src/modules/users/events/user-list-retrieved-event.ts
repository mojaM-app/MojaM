import { Event } from '@events';

export class UserListRetrievedEvent extends Event {
  public constructor(currentUserId: number | undefined) {
    super(currentUserId);
  }
}
