import { getDateNow } from '@utils';
import { Service } from 'typedi';
import { FindOneOptions, FindOptionsOrder, FindOptionsRelations, FindOptionsWhere, LessThanOrEqual } from 'typeorm';
import { BaseAnnouncementsRepository } from './base.announcements.repository';
import { Announcement } from '../../../dataBase/entities/announcements/announcement.entity';
import { AnnouncementStateValue } from '../enums/announcement-state.enum';

@Service()
export class CurrentAnnouncementsRepository extends BaseAnnouncementsRepository {
  constructor() {
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
