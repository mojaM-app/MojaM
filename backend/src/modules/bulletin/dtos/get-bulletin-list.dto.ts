import { BaseReqDto, events, type IResponse } from '@core';
import { BulletinStateType } from '../enums/bulletin-state.enum';

export interface IBulletinListItemDto {
  id: string;
  title: string;
  startDate: Date;
  daysCount: number;
  state: BulletinStateType;
  createdAt: Date;
  createdBy: string;
  publishedAt: Date | null;
  publishedBy: string | null;
}

export class GetBulletinListReqDto extends BaseReqDto {
  public readonly state?: BulletinStateType;

  constructor(state: BulletinStateType | undefined, currentUserId: number) {
    super(currentUserId);
    this.state = state;
  }
}

export class GetBulletinListResponseDto implements IResponse<IBulletinListItemDto[]> {
  public readonly data: IBulletinListItemDto[];
  public readonly message: string;

  constructor(data: IBulletinListItemDto[]) {
    this.data = data;
    this.message = events.bulletin.bulletinListRetrieved;
  }
}
