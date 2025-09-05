import { BaseReqDto, events, type IResponse } from '@core';

export interface IBulletinDaysMinMaxDto {
  minDate: Date | null;
  maxDate: Date | null;
}

export class GetBulletinDaysMinMaxDateReqDto extends BaseReqDto {
  constructor(currentUserId: number | undefined) {
    super(currentUserId);
  }
}

export class GetBulletinDaysMinMaxDateResponseDto implements IResponse<IBulletinDaysMinMaxDto> {
  public readonly data: IBulletinDaysMinMaxDto;
  public readonly message: string;

  constructor(data: IBulletinDaysMinMaxDto) {
    this.data = data;
    this.message = events.bulletin.bulletinDaysMinMaxDateRetrieved;
  }
}
