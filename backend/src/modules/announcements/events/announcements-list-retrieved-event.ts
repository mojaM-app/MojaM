import { Event } from '@events';

export class AnnouncementsListRetrievedEvent extends Event {
  constructor(currentUserId: number) {
    super(currentUserId);
  }
}
