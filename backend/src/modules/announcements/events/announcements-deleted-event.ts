import { Event } from '@core';
import { IAnnouncementsDto } from '../dtos/get-announcements.dto';

export class AnnouncementsDeletedEvent extends Event {
  public readonly announcements: IAnnouncementsDto;

  constructor(announcements: IAnnouncementsDto, currentUserId: number) {
    super(currentUserId);
    this.announcements = announcements;
  }
}
