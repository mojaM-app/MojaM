import { Event } from '@events';

export class PermissionsRetrievedEvent extends Event {
  constructor(currentUserId: number | undefined) {
    super(currentUserId);
  }
}
