import { events } from '@events';
import { IResponse } from '@interfaces';
import { Announcement } from '../entities/announcement.entity';

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

  public constructor(data: IGetCurrentAnnouncementsDto) {
    this.data = data;
    this.message = events.announcements.currentAnnouncementsRetrieved;
  }
}

export function announcementToICurrentAnnouncements(announcement: Announcement): ICurrentAnnouncementsDto {
  return {
    id: announcement.uuid,
    title: announcement.title,
    validFromDate: announcement.validFromDate!,
    createdBy: announcement.createdBy.getFullName()!,
    createdAt: announcement.createdAt,
    updatedAt: announcement.updatedAt ?? announcement.createdAt,
    publishedBy: announcement.publishedBy!.getFullName()!,
    publishedAt: announcement.publishedAt!,
    items: announcement.items.map(item => ({
      id: item.id,
      content: item.content,
      createdBy: item.createdBy.getFullName()!,
      createdAt: item.createdAt,
      updatedBy: item.updatedBy?.getFullName() ?? undefined,
      updatedAt: item.updatedAt ?? item.createdAt,
    })),
  } satisfies ICurrentAnnouncementsDto;
}
