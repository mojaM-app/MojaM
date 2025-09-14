import { BaseReqDto, events, type IResponse } from '@core';
import { IBulletinCalendarDayDto } from './get-bulletin-days.dto';

export interface IBulletinDaySectionDto {
  id: string;
  order: number;
  type: string;
  title: string | null;
  content: string | null;
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

export class GetBulletinDayReqDto extends BaseReqDto {
  public readonly dayId: string;

  constructor(dayId: string, currentUserId: number | undefined) {
    super(currentUserId);
    this.dayId = dayId;
  }
}

export class GetBulletinDayResponseDto implements IResponse<IBulletinCalendarDayDto> {
  public readonly data: IBulletinCalendarDayDto;
  public readonly message: string;

  constructor(data: IBulletinCalendarDayDto) {
    this.data = data;
    this.message = events.bulletin.bulletinCalendarDayRetrieved;
  }
}
