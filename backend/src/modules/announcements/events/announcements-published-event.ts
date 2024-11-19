import { Event } from '@events';
import { IAnnouncementsDto } from '@modules/announcements';

export class AnnouncementsPublishedEvent extends Event {
  public readonly announcements: IAnnouncementsDto;

  public constructor(announcements: IAnnouncementsDto, currentUserId: number) {
    super(currentUserId);
    this.announcements = announcements;
  }
}
