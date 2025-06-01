import { Event } from '@events';
import { IAnnouncementsDto } from '../dtos/get-announcements.dto';

export class AnnouncementsUpdatedEvent extends Event {
  public readonly announcements: IAnnouncementsDto;

  constructor(announcements: IAnnouncementsDto, currentUserId: number) {
    super(currentUserId);
    this.announcements = announcements;
  }
}
