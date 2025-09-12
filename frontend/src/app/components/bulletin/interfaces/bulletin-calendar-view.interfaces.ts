import { CalendarEvent } from 'angular-calendar';

export interface IBulletinDaysMinMaxDto {
  minDate: Date;
  maxDate: Date;
}

export interface IBulletinCalendarDayDto {
  id: string;
  bulletinId: string;
  title: string;
  date: string;
  isFirstDay: boolean;
  isLastDay: boolean;
}

export interface IBulletinCalendarDay extends CalendarEvent {
  bulletinId: string;
  title: string;
  isFirstDay: boolean;
  isLastDay: boolean;
}
