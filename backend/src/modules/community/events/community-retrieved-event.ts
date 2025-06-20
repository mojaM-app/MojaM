import { Event } from '@core';

export class CommunityRetrievedEvent extends Event {
  constructor(currentUserId: number | undefined) {
    super(currentUserId);
  }
}
