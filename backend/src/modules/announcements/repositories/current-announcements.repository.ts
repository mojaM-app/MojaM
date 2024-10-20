import { AnnouncementStateValue } from '@modules/announcements';
import { BaseRepository } from '@modules/common';
import { Service } from 'typedi';
import { FindOptionsWhere, MoreThan } from 'typeorm';
import { Announcement } from '../entities/announcement.entity';

@Service()
export class CurrentAnnouncementsRepository extends BaseRepository {
  public constructor() {
    super();
  }

  public async get(): Promise<Announcement | null> {
    const where: FindOptionsWhere<Announcement> = {
      state: AnnouncementStateValue.PUBLISHED,
      validFromDate: MoreThan(new Date()),
    };

    return await this._dbContext.announcements.findOneBy(where);
  }
}
