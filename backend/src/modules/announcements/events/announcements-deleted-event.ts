import { Event } from '@events';
import { IAnnouncementsDto } from '@modules/announcements';

export class AnnouncementsDeletedEvent extends Event {
  public readonly announcements: IAnnouncementsDto;

  constructor(announcements: IAnnouncementsDto, currentUserId: number) {
    super(currentUserId);
    this.announcements = announcements;
  }
}
