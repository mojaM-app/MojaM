import { Event } from '@core';

export class AnnouncementsListRetrievedEvent extends Event {
  constructor(currentUserId: number) {
    super(currentUserId);
  }
}
