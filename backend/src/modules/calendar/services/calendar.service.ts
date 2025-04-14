import { GoogleCalendarService, ICalendarEventDto } from '@modules/calendar';
import { BaseService } from '@modules/common';
import Container, { Service } from 'typedi';

@Service()
export class CalendarService extends BaseService {
  private readonly _googleCalendarService: GoogleCalendarService;

  constructor() {
    super();
    this._googleCalendarService = Container.get(GoogleCalendarService);
  }

  public async getEvents(startDate: Date, endDate: Date): Promise<ICalendarEventDto[]> {
    const events = await this._googleCalendarService.getEvents(startDate, endDate);
    return events ?? [];
  }
}
