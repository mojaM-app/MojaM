import { Event } from '@events';

export class AnnouncementsListRetrievedEvent extends Event {
  public constructor(currentUserId: number) {
    super(currentUserId);
  }
}
