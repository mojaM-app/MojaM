import { logger, events } from '@core';
import { EventSubscriber, On } from 'event-dispatch';
import { CalendarEventsRetrievedEvent } from '../events/calendar-events-retrieved-event';

@EventSubscriber()
export class CalendarEventsSubscriber {
  @On(events.calendar.eventsRetrieved)
  public onUserRetrieved(data: CalendarEventsRetrievedEvent): void {
    logger.debug(
      `Calendar events retrieved by user with id: '${data?.currentUserId}'. Start date: ${data?.startDate?.toISOString()}, end date: ${data?.endDate?.toISOString()}`,
    );
  }
}
