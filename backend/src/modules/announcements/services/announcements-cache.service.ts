import { CacheService } from '@modules/common';
import { Service } from 'typedi';
import { Announcement } from '../entities/announcement.entity';

@Service()
export class AnnouncementsCacheService extends CacheService<Announcement> {
  public constructor() {
    super();
  }

  protected override getEntityType(): string {
    return Announcement.name;
  }
}
