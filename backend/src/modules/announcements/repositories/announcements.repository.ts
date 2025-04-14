import { BadRequestException, errorKeys } from '@exceptions';
import { IUserId } from '@modules/users';
import { isNullOrUndefined } from '@utils';
import { isDate } from '@utils/date.utils';
import { Service } from 'typedi';
import { Equal, FindManyOptions, FindOptionsOrder, FindOptionsRelations, FindOptionsSelect, FindOptionsWhere } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { BaseAnnouncementsRepository } from './base.announcements.repository';
import { CreateAnnouncementsReqDto } from '../dtos/create-announcements.dto';
import { DeleteAnnouncementsReqDto } from '../dtos/delete-announcements.dto';
import { PublishAnnouncementsReqDto } from '../dtos/publish-announcements.dto';
import { UpdateAnnouncementItemDto, UpdateAnnouncementsDto, UpdateAnnouncementsReqDto } from '../dtos/update-announcements.dto';
import { AnnouncementItem } from '../entities/announcement-item.entity';
import { Announcement } from '../entities/announcement.entity';
import { AnnouncementStateValue } from '../enums/announcement-state.enum';
import { ICreateAnnouncement, ICreateAnnouncementItem } from '../interfaces/create-announcement.interfaces';
import { IAnnouncementId } from '../interfaces/IAnnouncementId';

@Service()
export class AnnouncementsRepository extends BaseAnnouncementsRepository {
  constructor() {
    super();
  }

  public async create(reqDto: CreateAnnouncementsReqDto): Promise<Announcement> {
    return await this._dbContext.transaction(async transactionalEntityManager => {
      const announcementsRepository = transactionalEntityManager.getRepository(Announcement);

      const announcement = await announcementsRepository.save({
        createdBy: { id: reqDto.currentUserId! } satisfies IUserId,
        state: AnnouncementStateValue.DRAFT,
        validFromDate: reqDto.announcements.validFromDate ?? null,
        title: reqDto.announcements.title ?? null,
      } satisfies ICreateAnnouncement);

      if (announcement.items === undefined) {
        announcement.items = [];
      }

      const announcementItemsRepository = transactionalEntityManager.getRepository(AnnouncementItem);

      const items = reqDto.announcements.items ?? [];

      let order = 1;
      for await (const item of items) {
        const announcementItem = await announcementItemsRepository.save({
          announcement,
          content: item.content,
          order: order++,
          createdBy: { id: reqDto.currentUserId! } satisfies IUserId,
        } satisfies ICreateAnnouncementItem);

        announcement.items.push(announcementItem);
      }

      return announcement;
    });
  }

  public async update(reqDto: UpdateAnnouncementsReqDto): Promise<number> {
    const id = await this.getIdByUuid(reqDto.announcementsId);

    await this._dbContext.transaction(async transactionalEntityManager => {
      const announcementsRepository = transactionalEntityManager.getRepository(Announcement);

      const announcements = await announcementsRepository.findOne({
        where: { id },
      });

      if (isNullOrUndefined(announcements)) {
        throw new BadRequestException(errorKeys.announcements.Announcements_Does_Not_Exist, {
          id: reqDto.announcementsId,
        });
      }

      if (announcements!.state === AnnouncementStateValue.PUBLISHED && isNullOrUndefined(reqDto.announcements.validFromDate)) {
        throw new BadRequestException(errorKeys.announcements.Cannot_Save_Published_Announcements_Without_ValidFromDate);
      }

      const updateAnnouncementModel = this.getUpdateAnnouncementModel(announcements!, reqDto.announcements);
      if (updateAnnouncementModel !== null) {
        await announcementsRepository.update(
          {
            id,
          } satisfies FindOptionsWhere<Announcement>,
          updateAnnouncementModel,
        );
      }

      if ((reqDto.announcements.items?.length ?? 0) > 0) {
        const announcementItemsRepository = transactionalEntityManager.getRepository(AnnouncementItem);
        const announcementItems = await announcementItemsRepository.find({
          where: {
            announcement: Equal(`${id}`),
          } satisfies FindOptionsWhere<AnnouncementItem>,
          relations: {
            announcement: true,
          } satisfies FindOptionsRelations<AnnouncementItem>,
          select: {
            announcement: {
              id: false,
            },
            id: true,
            content: true,
            order: true,
          } satisfies FindOptionsSelect<AnnouncementItem>,
        } satisfies FindManyOptions<AnnouncementItem>);

        let order = 1;
        for await (const itemDto of reqDto.announcements.items!) {
          const existingItem = announcementItems.find(x => x.id === itemDto.id);

          if (existingItem === undefined) {
            await announcementItemsRepository.save({
              announcement: { id: id! } satisfies IAnnouncementId,
              content: itemDto.content,
              createdBy: { id: reqDto.currentUserId! } satisfies IUserId,
              order,
            } satisfies ICreateAnnouncementItem);
          } else {
            if (this.checkIfUpdateAnnouncementItem(existingItem, itemDto, order)) {
              await announcementItemsRepository.update(
                {
                  id: existingItem.id,
                } satisfies FindOptionsWhere<AnnouncementItem>,
                {
                  content: itemDto.content,
                  updatedBy: { id: reqDto.currentUserId! } satisfies IUserId,
                  order,
                } satisfies QueryDeepPartialEntity<AnnouncementItem>,
              );
            }
          }
          order++;
        }

        for await (const item of announcementItems) {
          const existingItem = reqDto.announcements.items!.find(x => x.id === item.id);

          if (existingItem === undefined) {
            await announcementItemsRepository.delete({ id: item.id });
          }
        }
      }
    });

    return id!;
  }

  public async checkIfExistWithDate(validFromDate: Date | null | undefined, skippedAnnouncementUuid?: string): Promise<boolean> {
    if (!isDate(validFromDate)) {
      return false;
    }

    const count = await this._dbContext.announcements
      .createQueryBuilder('announcement')
      .where('ValidFromDate = :date', { date: validFromDate!.toISOString().slice(0, 10) })
      .andWhere('Uuid != :uuid', { uuid: skippedAnnouncementUuid ?? '' })
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
      order: {
        items: {
          order: 'ASC',
        },
      } satisfies FindOptionsOrder<Announcement>,
    });
  }

  public async delete(announcementId: number, reqDto: DeleteAnnouncementsReqDto): Promise<boolean> {
    await this._dbContext.announcementItems.createQueryBuilder().delete().where('AnnouncementId = :announcementId', { announcementId }).execute();

    await this._dbContext.announcements.delete({ id: announcementId });

    await this._cacheService.removeIdFromCacheAsync(reqDto.announcementsId);

    return true;
  }

  /**
     * Check if the announcement is connected with another data
     * currently, there is no related data
     * if there will be related data in the future, this part should be uncommented
  public async checkIfCanBeDeleted(announcementsId: number): Promise<string[]> {
    const relatedData: string[] = [];

    return relatedData;
  }
  */

  public async publish(announcements: Announcement, reqDto: PublishAnnouncementsReqDto): Promise<boolean> {
    return await this._dbContext.transaction(async transactionalEntityManager => {
      const announcementsRepository = transactionalEntityManager.getRepository(Announcement);

      await announcementsRepository.update(
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
    });
  }

  public async count(): Promise<number> {
    return await this._dbContext.announcements.count();
  }

  private getUpdateAnnouncementModel(announcementFromDb: Announcement, dto: UpdateAnnouncementsDto): QueryDeepPartialEntity<Announcement> | null {
    const result: QueryDeepPartialEntity<Announcement> = {};

    let wasChanged = false;
    if ((announcementFromDb.title ?? null) !== (dto.title ?? null)) {
      result.title = dto.title;
      wasChanged = true;
    }

    if ((announcementFromDb.validFromDate ?? null) !== (dto.validFromDate ?? null)) {
      result.validFromDate = dto.validFromDate;
      wasChanged = true;
    }

    return wasChanged ? result : null;
  }

  private checkIfUpdateAnnouncementItem(announcementItemFromDb: AnnouncementItem, dto: UpdateAnnouncementItemDto, order: number): boolean {
    return (announcementItemFromDb.content ?? null) !== (dto.content ?? null) || (announcementItemFromDb.order ?? null) !== order;
  }
}
