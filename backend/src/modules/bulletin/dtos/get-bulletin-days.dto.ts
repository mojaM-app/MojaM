import { BaseReqDto, events, type IResponse } from '@core';

export interface IBulletinCalendarDayDto {
  id: string;
  bulletinId: string;
  title: string;
  date: string;
  isFirstDay: boolean;
  isLastDay: boolean;
}

export class GetBulletinDaysReqDto extends BaseReqDto {
  public readonly startDate: Date;
  public readonly endDate: Date;

  constructor(startDate: string | undefined, endDate: string | undefined, currentUserId: number | undefined) {
    super(currentUserId);
    this.startDate = new Date(startDate ?? new Date().toISOString());
    this.endDate = new Date(endDate ?? new Date().toISOString());
  }
}

export class GetBulletinDaysResponseDto implements IResponse<IBulletinCalendarDayDto[]> {
  public readonly data: IBulletinCalendarDayDto[];
  public readonly message: string;

  constructor(data: IBulletinCalendarDayDto[]) {
    this.data = data;
    this.message = events.bulletin.bulletinCalendarDaysRetrieved;
  }
}
