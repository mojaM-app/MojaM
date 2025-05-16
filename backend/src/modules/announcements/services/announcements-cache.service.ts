import { CacheService } from '@modules/common';
import { Service } from 'typedi';
import { Announcement } from '../../../dataBase/entities/announcements/announcement.entity';

@Service()
export class AnnouncementsCacheService extends CacheService<Announcement> {
  constructor() {
    super();
  }

  protected override getEntityType(): string {
    return Announcement.name;
  }
}
