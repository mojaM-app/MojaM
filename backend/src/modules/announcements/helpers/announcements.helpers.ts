import { IAnnouncementsDto } from '@modules/announcements';
import { Announcement } from '../entities/announcement.entity';

export function announcementToIAnnouncements(announcement: Announcement): IAnnouncementsDto {
  return {
    id: announcement.uuid,
    title: announcement.title ?? undefined,
    state: announcement.state,
    validFromDate: announcement.validFromDate ?? undefined,
    createdBy: announcement.createdBy?.getFullName() ?? undefined,
    createdAt: announcement.createdAt,
    updatedAt: announcement.updatedAt ?? announcement.createdAt,
    publishedAt: announcement.publishedAt ?? undefined,
    publishedBy: announcement.publishedBy?.getFullName() ?? undefined,
    items: (announcement.items ?? []).map(item => ({
      id: item.id,
      content: item.content,
      createdBy: item.createdBy?.getFullName() ?? undefined,
      createdAt: item.createdAt,
      updatedBy: item.updatedBy?.getFullName() ?? undefined,
      updatedAt: item.updatedAt ?? undefined,
    })),
  } satisfies IAnnouncementsDto;
}
