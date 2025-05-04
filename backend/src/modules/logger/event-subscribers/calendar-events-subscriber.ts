import { events } from '@events';
import { CalendarEventsRetrievedEvent } from '@modules/calendar';
import { EventSubscriber, On } from 'event-dispatch';
import { logger } from '../logger';

@EventSubscriber()
export class CalendarEventsSubscriber {
  @On(events.calendar.eventsRetrieved)
  public onUserRetrieved(data: CalendarEventsRetrievedEvent): void {
    logger.debug(
      `Calendar events retrieved by user with id: '${data?.currentUserId}'. Start date: ${data?.startDate?.toISOString()}, end date: ${data?.endDate?.toISOString()}`,
    );
  }
}
