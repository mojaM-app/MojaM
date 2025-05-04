import { GOOGLE_API_CLIENT_ID, GOOGLE_API_CLIENT_SECRET, GOOGLE_API_REFRESH_TOKEN, GOOGLE_CALENDAR_ID } from '@config';
import { ICalendarEventDto } from '@modules/calendar';
import { logger } from '@modules/logger';
import { isNullOrEmptyString, isNullOrUndefined } from '@utils';
import { calendar_v3, google } from 'googleapis';
import { Service } from 'typedi';
import Calendar = calendar_v3.Calendar;
import Schema$Event = calendar_v3.Schema$Event;
import Schema$EventDateTime = calendar_v3.Schema$EventDateTime;

@Service()
export class GoogleCalendarService {
  private readonly googleAuthClient: any | undefined;

  constructor() {
    if (isNullOrEmptyString(GOOGLE_API_CLIENT_ID) || isNullOrEmptyString(GOOGLE_API_CLIENT_SECRET)) {
      this.googleAuthClient = undefined;
    } else {
      this.googleAuthClient = new google.auth.OAuth2(GOOGLE_API_CLIENT_ID, GOOGLE_API_CLIENT_SECRET);
      this.googleAuthClient.setCredentials({
        refresh_token: GOOGLE_API_REFRESH_TOKEN,
      });
    }
  }

  public async getEvents(startDate: Date, endDate: Date): Promise<any[] | undefined> {
    if (this.googleAuthClient === undefined) {
      logger.error('Google Calendar API is not configured.');
      return [];
    }

    if (isNullOrEmptyString(GOOGLE_CALENDAR_ID)) {
      logger.error('Google Calendar ID is not configured.');
      return [];
    }

    const calendar: Calendar = google.calendar({ version: 'v3', auth: this.googleAuthClient });
    const calendarResponse = await calendar.events.list({
      calendarId: GOOGLE_CALENDAR_ID,
      timeMin: startDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      timeMax: endDate.toISOString(),
    });

    const events = calendarResponse.data?.items;

    return this.processEvents(events);
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
        dateTime: date!.date + 'T00:00:00Z',
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
        dateTime: date!.date + 'T00:00:00Z',
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
    const date = new Date(value!);

    return date;
  }

  private isAllDayEvent(start?: Schema$EventDateTime): boolean {
    return (start?.date?.length ?? 0) > 0;
  }
}
