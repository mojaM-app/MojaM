import { IAnnouncementId, ICreateAnnouncement, ICreateAnnouncementItem, IUpdateAnnouncementItem, IUserId } from '@core';
import { BadRequestException, errorKeys } from '@exceptions';
import { isDate, isNullOrUndefined } from '@utils';
import { Service } from 'typedi';
import { FindOptionsWhere } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { AnnouncementItem } from './../../../dataBase/entities/announcements/announcement-item.entity';
import { BaseAnnouncementsRepository } from './base.announcements.repository';
import { CreateAnnouncementsReqDto } from '../dtos/create-announcements.dto';
import { DeleteAnnouncementsReqDto } from '../dtos/delete-announcements.dto';
import { PublishAnnouncementsReqDto } from '../dtos/publish-announcements.dto';
import { UpdateAnnouncementsDto, UpdateAnnouncementsReqDto } from '../dtos/update-announcements.dto';
import { AnnouncementStateValue } from '../enums/announcement-state.enum';
import { Announcement } from './../../../dataBase/entities/announcements/announcement.entity';

@Service()
export class AnnouncementsRepository extends BaseAnnouncementsRepository {
  constructor() {
    super();
  }

  public async getByUuid(uuid: string | null | undefined): Promise<Announcement | null> {
    const id = await this.getIdByUuid(uuid);

    if (isNullOrUndefined(id)) {
      return null;
    }

    return await this.get(id!);
  }

  public async get(announcementsId: number): Promise<Announcement | null> {
    return await this._dbContext.announcements
      .createQueryBuilder('announcement')
      .leftJoinAndSelect('announcement.createdBy', 'createdBy')
      .leftJoinAndSelect('announcement.publishedBy', 'publishedBy')
      .leftJoinAndSelect('announcement.items', 'items')
      .leftJoinAndSelect('items.createdBy', 'itemsCreatedBy')
      .leftJoinAndSelect('items.updatedBy', 'itemsUpdatedBy')
      .where('announcement.id = :announcementsId', { announcementsId })
      .orderBy('items.order', 'ASC')
      .getOne();
  }

  public async create(reqDto: CreateAnnouncementsReqDto): Promise<Announcement> {
    return await this._dbContext.transaction(async transactionalEntityManager => {
      const announcementsRepository = transactionalEntityManager.getRepository(Announcement);

      const announcement = await announcementsRepository.save({
        validFromDate: reqDto.announcements.validFromDate ?? null,
        title: reqDto.announcements.title ?? null,
        createdBy: {
          id: reqDto.currentUserId!,
        } satisfies IUserId,
        state: AnnouncementStateValue.DRAFT,
      } satisfies ICreateAnnouncement);

      if (isNullOrUndefined(announcement.items)) {
        announcement.items = [];
      }

      const announcementItemsRepository = transactionalEntityManager.getRepository(AnnouncementItem);
      const items = reqDto.announcements.items ?? [];

      if (items.length > 0) {
        const itemsToSave = items.map(
          (item, index) =>
            ({
              announcement,
              content: item.content,
              order: index + 1,
              createdBy: { id: reqDto.currentUserId! } satisfies IUserId,
            }) satisfies ICreateAnnouncementItem,
        );

        const savedItems = await announcementItemsRepository.save(itemsToSave);
        announcement.items = savedItems;
      }

      return announcement;
    });
  }

  public async update(reqDto: UpdateAnnouncementsReqDto): Promise<number> {
    const id = await this.getIdByUuid(reqDto.announcementsId);

    await this._dbContext.transaction(async entityManager => {
      const announcementsRepository = entityManager.getRepository(Announcement);

      const announcements = await announcementsRepository
        .createQueryBuilder('announcement')
        .leftJoinAndSelect('announcement.items', 'items')
        .where('announcement.id = :id', { id })
        .getOne();

      if (isNullOrUndefined(announcements)) {
        throw new BadRequestException(errorKeys.announcements.Announcements_Does_Not_Exist, {
          id: reqDto.announcementsId,
        });
      }

      if (
        announcements!.state === AnnouncementStateValue.PUBLISHED &&
        isNullOrUndefined(reqDto.announcements.validFromDate)
      ) {
        throw new BadRequestException(
          errorKeys.announcements.Cannot_Save_Published_Announcements_Without_ValidFromDate,
        );
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
        const announcementItemsRepository = entityManager.getRepository(AnnouncementItem);

        const existingItems = announcements!.items || [];
        const existingItemsMap = new Map(existingItems.map(item => [item.id, item]));
        const itemsToCreate: ICreateAnnouncementItem[] = [];
        const itemsToUpdate: IUpdateAnnouncementItem[] = [];
        const itemIdsToDelete: string[] = [];
        const processedItemIds = new Set<string>();

        reqDto.announcements.items!.forEach((itemDto, index) => {
          const order = index + 1;
          const existingItem = existingItemsMap.get(itemDto.id!);

          if (!existingItem) {
            itemsToCreate.push({
              announcement: { id: id! } satisfies IAnnouncementId,
              content: itemDto.content,
              createdBy: { id: reqDto.currentUserId! } satisfies IUserId,
              order,
            } satisfies ICreateAnnouncementItem);
          } else {
            processedItemIds.add(existingItem.id);

            if (existingItem.shouldBeUpdated(itemDto.content, order)) {
              itemsToUpdate.push({
                id: existingItem.id,
                content: itemDto.content,
                order,
                updatedBy: {
                  id: reqDto.currentUserId!,
                } satisfies IUserId,
              } satisfies IUpdateAnnouncementItem);
            }
          }
        });

        existingItems.forEach(item => {
          if (!processedItemIds.has(item.id)) {
            itemIdsToDelete.push(item.id);
          }
        });

        if (itemsToCreate.length > 0) {
          await announcementItemsRepository.save(itemsToCreate);
        }

        if (itemsToUpdate.length > 0) {
          const bulkUpdates = itemsToUpdate.map(item =>
            announcementItemsRepository.update(
              {
                id: item.id,
              } satisfies FindOptionsWhere<AnnouncementItem>,
              {
                content: item.content,
                updatedBy: item.updatedBy,
                order: item.order,
              } satisfies QueryDeepPartialEntity<AnnouncementItem>,
            ),
          );

          await Promise.all(bulkUpdates);
        }

        if (itemIdsToDelete.length > 0) {
          await announcementItemsRepository.delete(itemIdsToDelete);
        }
      }
    });

    return id!;
  }

  public async checkIfExistWithDate(
    validFromDate: Date | null | undefined,
    skippedUuid?: string,
  ): Promise<boolean> {
    if (!isDate(validFromDate)) {
      return false;
    }

    const count = await this._dbContext.announcements
      .createQueryBuilder('announcement')
      .where('ValidFromDate = :date', { date: validFromDate!.toISOString().slice(0, 10) })
      .andWhere('Uuid != :uuid', { uuid: skippedUuid ?? '' })
      .getCount();

    return count > 0;
  }

  public async delete(announcementId: number, reqDto: DeleteAnnouncementsReqDto): Promise<boolean> {
    await this._dbContext.announcementItems
      .createQueryBuilder()
      .delete()
      .where('AnnouncementId = :announcementId', { announcementId })
      .execute();

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

  private getUpdateAnnouncementModel(
    announcementFromDb: Announcement,
    dto: UpdateAnnouncementsDto,
  ): QueryDeepPartialEntity<Announcement> | null {
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
}
