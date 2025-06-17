import { Event } from '@core';
import { ICurrentAnnouncementsDto } from '../dtos/get-current-announcements.dto';

export class CurrentAnnouncementsRetrievedEvent extends Event {
  public readonly announcements: ICurrentAnnouncementsDto | null;

  constructor(announcements: ICurrentAnnouncementsDto | null, currentUserId: number | undefined) {
    super(currentUserId);
    this.announcements = announcements;
  }
}
