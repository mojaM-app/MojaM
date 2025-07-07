import { DatabaseLoggerService, events } from '@core';
import { EventSubscriber, On } from 'event-dispatch';
import { Container } from 'typedi';
import { CalendarEventsRetrievedEvent } from '../events/calendar-events-retrieved-event';

@EventSubscriber()
export class CalendarEventsSubscriber {
  private readonly _databaseLoggerService: DatabaseLoggerService;

  constructor() {
    this._databaseLoggerService = Container.get(DatabaseLoggerService);
  }

  @On(events.calendar.eventsRetrieved)
  public onUserRetrieved(data: CalendarEventsRetrievedEvent): void {
    this._databaseLoggerService.debug(
      `Calendar events retrieved by user with id: '${data.currentUserId}'. Start date: ${data.startDate.toISOString()}, end date: ${data.endDate.toISOString()}`,
    );
  }
}
