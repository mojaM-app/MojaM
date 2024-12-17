import { AnnouncementStateValue } from '@modules/announcements';
import { getDateNow } from '@utils';
import { Service } from 'typedi';
import { FindOneOptions, FindOptionsOrder, FindOptionsRelations, FindOptionsWhere, LessThanOrEqual } from 'typeorm';
import { Announcement } from '../entities/announcement.entity';
import { BaseAnnouncementsRepository } from './base.announcements.repository';

@Service()
export class CurrentAnnouncementsRepository extends BaseAnnouncementsRepository {
  public constructor() {
    super();
  }

  public async get(): Promise<Announcement | null> {
    const options: FindOneOptions<Announcement> = {
      where: {
        state: AnnouncementStateValue.PUBLISHED,
        validFromDate: LessThanOrEqual(getDateNow()),
      } satisfies FindOptionsWhere<Announcement>,
      order: {
        validFromDate: 'DESC',
        items: {
          order: 'ASC',
        },
      } satisfies FindOptionsOrder<Announcement>,
      relations: {
        createdBy: true,
        publishedBy: true,
        items: {
          createdBy: true,
          updatedBy: true,
        },
      } satisfies FindOptionsRelations<Announcement>,
    };

    return await this._dbContext.announcements.findOne(options);
  }
}
