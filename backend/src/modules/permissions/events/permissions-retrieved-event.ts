import { Event } from '@core';

export class PermissionsRetrievedEvent extends Event {
  constructor(currentUserId: number | undefined) {
    super(currentUserId);
  }
}
