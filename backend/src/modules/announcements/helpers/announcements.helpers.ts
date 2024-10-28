import { IAnnouncementsDto, ICurrentAnnouncementsDto } from '@modules/announcements';
import { Announcement } from '../entities/announcement.entity';

export function announcementToICurrentAnnouncements(announcement: Announcement): ICurrentAnnouncementsDto {
  return {
    id: announcement.uuid,
    title: announcement.title,
    validFromDate: announcement.validFromDate,
    publishedAt: announcement.publishedAt,
  } satisfies ICurrentAnnouncementsDto;
}

export function announcementToIAnnouncements(announcement: Announcement): IAnnouncementsDto {
  return {
    id: announcement.uuid,
    title: announcement.title,
    validFromDate: announcement.validFromDate,
    publishedAt: announcement.publishedAt,
  } satisfies IAnnouncementsDto;
}
