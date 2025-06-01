import { events } from '@events';
import { BaseService } from '@modules/common';
import { Service } from 'typedi';
import { GoogleCalendarService } from './google-calendar.service';
import { GetCalendarEventsReqDto, ICalendarEventDto } from '../dtos/calendar.dto';
import { CalendarEventsRetrievedEvent } from '../events/calendar-events-retrieved-event';

@Service()
export class CalendarService extends BaseService {
  constructor(private readonly _googleCalendarService: GoogleCalendarService) {
    super();
  }

  public async getEvents(reqDto: GetCalendarEventsReqDto): Promise<ICalendarEventDto[]> {
    const result = await this._googleCalendarService.getEvents(reqDto.startDate, reqDto.endDate);

    this._eventDispatcher.dispatch(
      events.calendar.eventsRetrieved,
      new CalendarEventsRetrievedEvent(reqDto.startDate, reqDto.endDate, reqDto.currentUserId),
    );

    return result ?? [];
  }
}
