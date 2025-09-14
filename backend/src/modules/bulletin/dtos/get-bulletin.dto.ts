import { BaseReqDto, events, type IResponse } from '@core';
import { SectionType } from '../enums/bulletin-section-type.enum';
import { BulletinState } from '../enums/bulletin-state.enum';

export interface IBulletinSectionSettings {
  includeInPdf: boolean;
  expanded: boolean;
}

export interface IBulletinDaySectionDto {
  id: string;
  title: string | null;
  content: string | null;
  type: SectionType;
  order: number;
  createdAt?: Date;
  createdBy?: string;
  updatedAt?: Date;
  updatedBy?: string | null;
  settings: IBulletinSectionSettings;
}

export interface IBulletinDayDto {
  id: string;
  date: Date | null;
  title: string | null;
  sections: IBulletinDaySectionDto[];
  createdAt?: Date;
  createdBy?: string;
  updatedAt?: Date;
  updatedBy?: string | null;
}

export interface IBulletinDto {
  id: string;
  date: Date | null;
  title: string | null;
  state: BulletinState;
  number: number | null;
  introduction: string | null;
  tipsForWork: string | null;
  dailyPrayer: string | null;
  createdAt: Date;
  createdBy: string | null;
  updatedAt: Date;
  updatedBy: string | null;
  publishedAt: Date | null;
  publishedBy: string | null;
  days: IBulletinDayDto[];
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
