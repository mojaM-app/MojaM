import { BaseReqDto, events, type IResponse } from '@core';
import { BulletinStateType } from '../enums/bulletin-state.enum';

export interface IBulletinTaskDto {
  id: string;
  taskOrder: number;
  description: string;
  hasCommentField: boolean;
}

export interface IBulletinDayDto {
  id: string;
  dayNumber: number;
  introduction: string | null;
  instructions: string;
  tasks: IBulletinTaskDto[];
}

export interface IBulletinQuestionDto {
  id: string;
  questionType: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBulletinDto {
  id: string; // uuid, not database id
  title: string;
  startDate: Date;
  daysCount: number;
  state: BulletinStateType;
  createdAt: Date;
  createdBy: string;
  modifiedAt: Date;
  modifiedBy: string | null;
  publishedAt: Date | null;
  publishedBy: string | null;
  days: IBulletinDayDto[];
  questions: IBulletinQuestionDto[];
}

export interface IBulletinListItemDto {
  id: string; // uuid
  title: string;
  startDate: Date;
  daysCount: number;
  state: BulletinStateType;
  createdAt: Date;
  createdBy: string;
  publishedAt: Date | null;
  publishedBy: string | null;
}

export class GetBulletinReqDto extends BaseReqDto {
  public readonly bulletinUuid: string | undefined;

  constructor(bulletinUuid: string | undefined, currentUserId: number) {
    super(currentUserId);
    this.bulletinUuid = bulletinUuid;
  }
}

export class GetBulletinResponseDto implements IResponse<IBulletinDto> {
  public readonly data: IBulletinDto;
  public readonly message: string;

  constructor(data: IBulletinDto) {
    this.data = data;
    this.message = events.bulletin.bulletinRetrieved;
  }
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
