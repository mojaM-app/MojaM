import { Event } from '@core';
import { type IBulletinDto } from '../dtos/get-bulletin.dto';

export class BulletinCreatedEvent extends Event {
  public readonly bulletin: IBulletinDto;

  constructor(bulletin: IBulletinDto, currentUserId: number) {
    super(currentUserId);
    this.bulletin = bulletin;
  }
}
