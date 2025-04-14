import { Event } from '@events';

export class UserListRetrievedEvent extends Event {
  constructor(currentUserId: number | undefined) {
    super(currentUserId);
  }
}
