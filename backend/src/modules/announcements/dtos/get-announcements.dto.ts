import { events } from '@events';
import { IResponse } from '@interfaces';

export interface IAnnouncementItemDto {
  id: string;
  content: string;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

export interface IAnnouncementsDto {
  id: string;
  title?: string;
  state: number;
  validFromDate?: Date;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  publishedAt?: Date;
  publishedBy?: string;
  items: IAnnouncementItemDto[];
}

export class GetAnnouncementsResponseDto implements IResponse<IAnnouncementsDto> {
  public readonly data: IAnnouncementsDto;
  public readonly message: string;

  public constructor(data: IAnnouncementsDto) {
    this.data = data;
    this.message = events.announcements.announcementsRetrieved;
  }
}
