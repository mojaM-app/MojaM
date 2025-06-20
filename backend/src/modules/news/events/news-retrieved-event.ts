import { Event } from '@core';

export class NewsRetrievedEvent extends Event {
  constructor(currentUserId: number | undefined) {
    super(currentUserId);
  }
}
