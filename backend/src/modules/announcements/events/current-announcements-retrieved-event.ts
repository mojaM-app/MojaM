import { Event } from '@events';
import { ICurrentAnnouncementsDto } from '@modules/announcements';

export class CurrentAnnouncementsRetrievedEvent extends Event {
  public readonly announcements: ICurrentAnnouncementsDto | null;

  public constructor(announcements: ICurrentAnnouncementsDto | null, currentUserId: number | undefined) {
    super(currentUserId);
    this.announcements = announcements;
  }
}
