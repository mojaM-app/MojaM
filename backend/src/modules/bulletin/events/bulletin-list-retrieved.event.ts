import { Event } from '@core';

export class BulletinListRetrievedEvent extends Event {
  constructor(currentUserId: number) {
    super(currentUserId);
  }
}
