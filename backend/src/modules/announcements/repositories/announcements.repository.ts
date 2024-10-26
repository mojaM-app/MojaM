import { BaseRepository } from '@modules/common';
import { IUserId } from '@modules/users';
import { Service } from 'typedi';
import { CreateAnnouncementsReqDto } from '../dtos/create-announcements.dto';
import { AnnouncementItem } from '../entities/announcement-item.entity';
import { Announcement } from '../entities/announcement.entity';
import { AnnouncementStateValue } from '../enums/announcement-state.enum';
import { ICreateAnnouncement, ICreateAnnouncementItem } from '../interfaces/create-announcement.interfaces';

@Service()
export class AnnouncementsRepository extends BaseRepository {
  public constructor() {
    super();
  }

  public async create(reqDto: CreateAnnouncementsReqDto): Promise<Announcement | null> {
    return await this._dbContext.transaction(async transactionalEntityManager => {
      const announcementsRepository = transactionalEntityManager.getRepository(Announcement);

      const announcement = await announcementsRepository.save({
        createdBy: { id: reqDto.currentUserId! } satisfies IUserId,
        state: AnnouncementStateValue.DRAFT,
        validFromDate: reqDto.announcements.validFromDate,
        title: reqDto.announcements.title,
      } satisfies ICreateAnnouncement);

      if (announcement.items === undefined) {
        announcement.items = [];
      }

      const announcementItemsRepository = transactionalEntityManager.getRepository(AnnouncementItem);

      const items = reqDto.announcements.items ?? [];

      for await (const item of items) {
        const announcementItem = await announcementItemsRepository.save({
          announcement,
          content: item.content,
          createdBy: { id: reqDto.currentUserId! } satisfies IUserId,
        } satisfies ICreateAnnouncementItem);

        announcement.items.push(announcementItem);
      }

      return announcement;
    });
  }

  public async checkIfExistWithDate(validFromDate: Date | undefined): Promise<boolean> {
    return await this._dbContext.announcements.existsBy({
      validFromDate,
    });
  }
}
