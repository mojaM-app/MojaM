import { CalendarEvent } from 'angular-calendar';

export interface ICalendarEventDto {
  start: string | null | undefined;
  end: string | null | undefined;
  title: string | null | undefined;
  location: string | null | undefined;
  allDay: boolean | null | undefined;
}

export interface ICalendarEvent extends CalendarEvent {
  location?: string | null;
}
