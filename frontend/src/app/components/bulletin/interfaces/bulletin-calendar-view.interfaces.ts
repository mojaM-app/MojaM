import { CalendarEvent } from 'angular-calendar';
import { SectionType } from '../enums/section-type.enum';

export interface IBulletinDaysMinMaxDto {
  minDate: Date;
  maxDate: Date;
}

export interface IBulletinCalendarDayDto {
  id: string;
  bulletinId: string;
  title: string;
  date: Date;
}

export interface IBulletinCalendarDay extends CalendarEvent {
  bulletinId: string;
  title: string;
}

export interface IBulletinDaySectionDto {
  id: string;
  order: number;
  type: SectionType;
  title: string;
  content: string;
  settings: any;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string | null;
}

export interface IBulletinCalendarDayWithSectionsDto extends IBulletinCalendarDayDto {
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string | null;
  sections: IBulletinDaySectionDto[];
}
