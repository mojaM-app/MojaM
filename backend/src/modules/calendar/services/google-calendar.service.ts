import { type Credentials } from 'google-auth-library';
import { calendar_v3 as CalendarV3, google } from 'googleapis';
import { Container, Service } from 'typedi';
import { GOOGLE_API_CLIENT_ID, GOOGLE_API_CLIENT_SECRET, GOOGLE_API_REFRESH_TOKEN, GOOGLE_CALENDAR_ID } from '@config';
import { DatabaseLoggerService } from '@core';
import { isNullOrEmptyString, isNullOrUndefined } from '@utils';
import { ICalendarEventDto } from '../dtos/calendar.dto';
import Calendar = CalendarV3.Calendar;
import Schema$Event = CalendarV3.Schema$Event;
import Schema$EventDateTime = CalendarV3.Schema$EventDateTime;

@Service()
export class GoogleCalendarService {
  private readonly _googleAuthClient: any | undefined;
  private readonly _databaseLoggerService: DatabaseLoggerService;
  constructor() {
    this._databaseLoggerService = Container.get(DatabaseLoggerService);
    if (isNullOrEmptyString(GOOGLE_API_CLIENT_ID) || isNullOrEmptyString(GOOGLE_API_CLIENT_SECRET)) {
      this._googleAuthClient = undefined;
    } else {
      this._googleAuthClient = new google.auth.OAuth2(GOOGLE_API_CLIENT_ID, GOOGLE_API_CLIENT_SECRET);
      this._googleAuthClient.setCredentials({
        refresh_token: GOOGLE_API_REFRESH_TOKEN,
      } satisfies Credentials);
    }
  }

  public async getEvents(startDate: Date, endDate: Date): Promise<any[] | undefined> {
    if (this._googleAuthClient === undefined) {
      this._databaseLoggerService.error('Google Calendar API is not configured');
      return [];
    }

    if (isNullOrEmptyString(GOOGLE_CALENDAR_ID)) {
      this._databaseLoggerService.error('Google Calendar ID is not configured');
      return [];
    }

    const calendar: Calendar = google.calendar({ version: 'v3', auth: this._googleAuthClient });
    const calendarResponse = await calendar.events.list({
      calendarId: GOOGLE_CALENDAR_ID,
      timeMin: startDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      timeMax: endDate.toISOString(),
    });

    const { data } = calendarResponse;
    return this.processEvents(isNullOrUndefined(data) ? undefined : data.items);
  }

  private processEvents(events: Schema$Event[] | undefined): ICalendarEventDto[] {
    if ((events?.length ?? 0) === 0) {
      return [];
    }

    return events!.map((event: Schema$Event) => {
      return this.processEvent(event);
    });
  }

  private processEvent(event: Schema$Event): ICalendarEventDto {
    return {
      start: this.getStartDate(event.start),
      end: this.getEndDate(event.end),
      title: event.summary,
      allDay: this.isAllDayEvent(event.start),
      location: event.location,
    } satisfies ICalendarEventDto;
  }

  private getEndDate(date: Schema$EventDateTime | undefined): Date | undefined {
    if (!isNullOrEmptyString(date?.date)) {
      const endDate = this.getDate({
        dateTime: `${date!.date}T00:00:00Z`,
        timeZone: 'UTC',
      } satisfies Schema$EventDateTime);

      endDate!.setDate(endDate!.getDate() - 1);

      return endDate;
    }

    return this.getDate(date);
  }

  private getStartDate(date: Schema$EventDateTime | undefined): Date | undefined {
    if (!isNullOrEmptyString(date?.date)) {
      return this.getDate({
        dateTime: `${date!.date}T00:00:00Z`,
        timeZone: 'UTC',
      } satisfies Schema$EventDateTime);
    }

    return this.getDate(date);
  }

  private getDate(date?: Schema$EventDateTime | undefined | null): Date | undefined {
    if (isNullOrUndefined(date)) {
      return undefined;
    }

    const value = date!.dateTime ?? date!.date;
    if (isNullOrEmptyString(value)) {
      return undefined;
    }

    return this.parseDateTime(value);
  }

  private parseDateTime(value: string | null | undefined): Date {
    if (value?.length === 0) {
      return new Date();
    }
    return new Date(value!);
  }

  private isAllDayEvent(start?: Schema$EventDateTime): boolean {
    return (start?.date?.length ?? 0) > 0;
  }
}
