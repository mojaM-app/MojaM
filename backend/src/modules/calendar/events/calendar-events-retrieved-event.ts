import { Event } from '@core';

export class CalendarEventsRetrievedEvent extends Event {
  public readonly startDate: Date;
  public readonly endDate: Date;

  constructor(startDate: Date, endDate: Date, currentUserId: number | undefined) {
    super(currentUserId);
    this.startDate = startDate;
    this.endDate = endDate;
  }
}
