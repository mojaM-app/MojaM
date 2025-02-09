import { Event } from '@events';

export class PermissionsRetrievedEvent extends Event {
  public constructor(currentUserId: number | undefined) {
    super(currentUserId);
  }
}
