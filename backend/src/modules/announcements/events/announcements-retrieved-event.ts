import { Event } from '@events';
import { IAnnouncementsDto } from '@modules/announcements';

export class AnnouncementsRetrievedEvent extends Event {
  public readonly announcements: IAnnouncementsDto | null;

  public constructor(announcements: IAnnouncementsDto | null, currentUserId: number | undefined) {
    super(currentUserId);
    this.announcements = announcements;
  }
}
