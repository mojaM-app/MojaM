import { Event } from '@core';
import { IBulletinDto } from '../dtos/get-bulletin.dto';

export class BulletinPublishedEvent extends Event {
  public readonly bulletin: IBulletinDto;

  constructor(bulletin: IBulletinDto, currentUserId: number) {
    super(currentUserId);
    this.bulletin = bulletin;
  }
}
