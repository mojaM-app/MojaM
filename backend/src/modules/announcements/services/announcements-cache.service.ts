import { CacheService } from '@core';
import { Service } from 'typedi';
import { Announcement } from '../../../dataBase/entities/announcements/announcement.entity';

@Service()
export class AnnouncementsCacheService extends CacheService<Announcement> {
  constructor() {
    super();
  }

  protected override getEntityName(): string {
    return Announcement.typeName;
  }
}
