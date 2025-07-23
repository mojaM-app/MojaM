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
  title: string | null;
  startDate: Date | null;
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

export class GetBulletinReqDto extends BaseReqDto {
  public readonly bulletinUuid: string | undefined;

  constructor(bulletinUuid: string | undefined, currentUserId: number | undefined) {
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
