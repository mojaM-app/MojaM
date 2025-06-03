import { IResponse } from '@core';
import { events } from '@events';

export interface ICurrentAnnouncementsItemDto {
  id: string;
  content: string;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy?: string;
}

export interface ICurrentAnnouncementsDto {
  id: string;
  title: string | null;
  validFromDate: Date;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  publishedAt: Date;
  publishedBy: string;
  items: ICurrentAnnouncementsItemDto[];
}

export interface IGetCurrentAnnouncementsDto {
  currentAnnouncements: ICurrentAnnouncementsDto | null;
  announcementsCount: number;
}

export class GetCurrentAnnouncementsResponseDto implements IResponse<IGetCurrentAnnouncementsDto> {
  public readonly data: IGetCurrentAnnouncementsDto;
  public readonly message: string;

  constructor(data: IGetCurrentAnnouncementsDto) {
    this.data = data;
    this.message = events.announcements.currentAnnouncementsRetrieved;
  }
}
