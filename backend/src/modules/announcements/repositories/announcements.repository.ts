import { IUserId } from '@modules/users';
import { isNullOrUndefined } from '@utils';
import { isDate } from '@utils/date.utils';
import { Service } from 'typedi';
import { FindOptionsRelations, FindOptionsWhere } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { CreateAnnouncementsReqDto } from '../dtos/create-announcements.dto';
import { DeleteAnnouncementsReqDto } from '../dtos/delete-announcements.dto';
import { PublishAnnouncementsReqDto } from '../dtos/publish-announcements.dto';
import { AnnouncementItem } from '../entities/announcement-item.entity';
import { Announcement } from '../entities/announcement.entity';
import { AnnouncementStateValue } from '../enums/announcement-state.enum';
import { ICreateAnnouncement, ICreateAnnouncementItem } from '../interfaces/create-announcement.interfaces';
import { BaseAnnouncementsRepository } from './base.announcements.repository';

@Service()
export class AnnouncementsRepository extends BaseAnnouncementsRepository {
  public constructor() {
    super();
  }

  public async create(reqDto: CreateAnnouncementsReqDto): Promise<Announcement> {
    return await this._dbContext.transaction(async transactionalEntityManager => {
      const announcementsRepository = transactionalEntityManager.getRepository(Announcement);

      const announcement = await announcementsRepository.save({
        createdBy: { id: reqDto.currentUserId! } satisfies IUserId,
        state: AnnouncementStateValue.DRAFT,
        validFromDate: isNullOrUndefined(reqDto.announcements.validFromDate) ? undefined : reqDto.announcements.validFromDate!,
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
    if (!isDate(validFromDate)) {
      return false;
    }

    const count = await this._dbContext.announcements
      .createQueryBuilder('announcement')
      .where('ValidFromDate = :date', { date: validFromDate?.toISOString().slice(0, 10) })
      .getCount();

    return count > 0;
  }

  public async getByUuid(uuid: string | null | undefined): Promise<Announcement | null> {
    const id = await this.getIdByUuid(uuid);

    if (isNullOrUndefined(id)) {
      return null;
    }

    return await this.get(id!);
  }

  public async get(announcementsId: number): Promise<Announcement | null> {
    return await this._dbContext.announcements.findOne({
      where: { id: announcementsId },
      relations: {
        createdBy: true,
        publishedBy: true,
        items: {
          createdBy: true,
          updatedBy: true,
        },
      } satisfies FindOptionsRelations<Announcement>,
    });
  }

  public async delete(announcements: Announcement, reqDto: DeleteAnnouncementsReqDto): Promise<boolean> {
    await this._dbContext.announcementItems
      .createQueryBuilder()
      .delete()
      .where('AnnouncementId = :announcementId', { announcementId: announcements.id })
      .execute();

    await this._dbContext.announcements.delete({ id: announcements.id });

    return true;
  }

  public async checkIfCanBeDeleted(announcementsId: number): Promise<string[]> {
    const relatedData: string[] = [];

    return relatedData;
  }

  public async publish(announcements: Announcement, reqDto: PublishAnnouncementsReqDto): Promise<boolean> {
    await this._dbContext.announcements.update(
      {
        id: announcements.id,
      } satisfies FindOptionsWhere<Announcement>,
      {
        state: AnnouncementStateValue.PUBLISHED,
        publishedBy: {
          id: reqDto.currentUserId!,
        } satisfies IUserId,
        publishedAt: new Date(),
      } satisfies QueryDeepPartialEntity<Announcement>,
    );

    return true;
  }

  public async count(): Promise<number> {
    return await this._dbContext.announcements.count();
  }
}
