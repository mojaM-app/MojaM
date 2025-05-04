import { events } from '@events';
import { CalendarEventsRetrievedEvent, GetCalendarEventsReqDto, GoogleCalendarService, ICalendarEventDto } from '@modules/calendar';
import { BaseService } from '@modules/common';
import Container, { Service } from 'typedi';

@Service()
export class CalendarService extends BaseService {
  private readonly _googleCalendarService: GoogleCalendarService;

  constructor() {
    super();
    this._googleCalendarService = Container.get(GoogleCalendarService);
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
