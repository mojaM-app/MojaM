import { CalendarEvent } from 'angular-calendar';

export interface IBulletinDaysMinMaxDto {
  minDate: Date;
  maxDate: Date;
}

export interface IBulletinCalendarDayDto {
  dayId: string;
}

export interface IBulletinCalendarDay extends CalendarEvent {
  dayId: string;
}
