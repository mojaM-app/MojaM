import { CalendarEvent as calCalendarEvent } from 'angular-calendar';

export interface ICalendarEvent {
  start: string | null | undefined;
  end: string | null | undefined;
  title: string | null | undefined;
  location: string | null | undefined;
  allDay: boolean | null | undefined;
}

export interface CalendarEvent extends calCalendarEvent {
  location?: string | null;
}
