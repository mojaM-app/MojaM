import { ICreateBulletin, ICreateBulletinDay, IUserId } from '@core';
import { ICreateBulletinDaySection } from '@core/interfaces/bulletin/bulletin-day-section.interfaces';
import { BadRequestException, errorKeys } from '@exceptions';
import { isDate, isNullOrUndefined, isPositiveNumber } from '@utils';
import { Service } from 'typedi';
import { FindOptionsWhere } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Bulletin } from '../../../dataBase/entities/bulletin/bulletin.entity';
import { CreateBulletinDto } from '../dtos/create-bulletin.dto';
import { UpdateBulletinDaySectionDto, UpdateBulletinDto } from '../dtos/update-bulletin.dto';
import { BulletinState } from '../enums/bulletin-state.enum';
import { BulletinDaySection } from './../../../dataBase/entities/bulletin/bulletin-day-section.entity';
import { BulletinDay } from './../../../dataBase/entities/bulletin/bulletin-day.entity';
import { BaseBulletinRepository } from './base-bulletin.repository';
import { SectionType } from '../enums/bulletin-section-type.enum';

@Service()
export class BulletinRepository extends BaseBulletinRepository {
  constructor() {
    super();
  }

  public async getByUuid(uuid: string | null | undefined): Promise<Bulletin | null> {
    const id = await this.getIdByUuid(uuid);

    if (isNullOrUndefined(id)) {
      return null;
    }

    return await this.get(id!);
  }

  public async get(id: number | null | undefined): Promise<Bulletin | null> {
    if (!isPositiveNumber(id)) {
      return null;
    }

    return await this._dbContext.bulletins.findOne({
      where: { id: id! },
      relations: {
        days: {
          sections: true,
        },
        createdBy: true,
        updatedBy: true,
        publishedBy: true,
      },
    });
  }

  public async create(reqDto: CreateBulletinDto, userId: number): Promise<{ id: number }> {
    if (reqDto.days && reqDto.days.length > 0) {
      this.validateUniqueBulletinDayDates(reqDto.days);
    }

    return await this._dbContext.transaction(async transactionalEntityManager => {
      const bulletinRepository = transactionalEntityManager.getRepository(Bulletin);

      let bulletin: Bulletin;
      try {
        bulletin = await bulletinRepository.save({
          title: reqDto.title ?? null,
          date: reqDto.date ?? null,
          number: reqDto.number ?? null,
          state: BulletinState.Draft,
          createdBy: {
            id: userId,
          } satisfies IUserId,
          introduction: reqDto.introduction ?? null,
          tipsForWork: reqDto.tipsForWork ?? null,
          dailyPrayer: reqDto.dailyPrayer ?? null,
        } satisfies ICreateBulletin);
      } catch (error: unknown) {
        if (this.isUniqueConstraintError(error, 'UQ_Bulletin_Date')) {
          throw new BadRequestException(errorKeys.bulletin.Bulletin_With_Given_Date_Already_Exists, {
            date: reqDto.date,
          });
        }
        throw error;
      }

      if (isNullOrUndefined(bulletin.days)) {
        bulletin.days = [];
      }

      const bulletinDaysRepository = transactionalEntityManager.getRepository(BulletinDay);
      const bulletinDaySectionsRepository = transactionalEntityManager.getRepository(BulletinDaySection);

      for (const dayDto of reqDto.days ?? []) {
        const bulletinDay = {
          bulletin: bulletin,
          date: dayDto.date ?? null,
          title: dayDto.title ?? null,
          createdBy: {
            id: userId,
          } satisfies IUserId,
        } satisfies ICreateBulletinDay;

        let day: BulletinDay;
        try {
          day = await bulletinDaysRepository.save(bulletinDay);
        } catch (error: unknown) {
          if (this.isUniqueConstraintError(error, 'UQ_BulletinDay_Date')) {
            throw new BadRequestException(errorKeys.bulletin.Bulletin_Day_With_Given_Date_Already_Exists, {
              date: dayDto.date.toLocaleDateString(),
            });
          }
          throw error;
        }

        const sectionsToSave = (dayDto.sections ?? [])
          .sort((a, b) => a.order - b.order)
          .map(
            (item, index) =>
              ({
                bulletinDay: {
                  id: day.id,
                },
                content: item.content,
                order: index + 1,
                createdBy: {
                  id: userId,
                } satisfies IUserId,
                title: item.title,
                type: item.type,
              }) satisfies ICreateBulletinDaySection,
          );

        await bulletinDaySectionsRepository.save(sectionsToSave);
      }

      return bulletin;
    });
  }

  public async checkIfExistWithDate(date: Date | null | undefined, skippedUuid?: string): Promise<boolean> {
    if (!isDate(date)) {
      return false;
    }

    const queryBuilder = this._dbContext.bulletins
      .createQueryBuilder('bulletin')
      .where('Date = :date', { date: date!.toISOString().slice(0, 10) });

    if (skippedUuid) {
      queryBuilder.andWhere('Uuid != :uuid', { uuid: skippedUuid });
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }

  public async update(reqDto: UpdateBulletinDto, bulletinId: number, userId: number): Promise<number> {
    // Validate unique dates for bulletin days
    if (reqDto.days && reqDto.days.length > 0) {
      this.validateUniqueBulletinDayDates(reqDto.days);
    }

    await this._dbContext.transaction(async entityManager => {
      const bulletinRepository = entityManager.getRepository(Bulletin);

      const bulletin = await bulletinRepository
        .createQueryBuilder('bulletin')
        .leftJoinAndSelect('bulletin.days', 'days')
        .leftJoinAndSelect('days.sections', 'sections')
        .where('bulletin.id = :id', { id: bulletinId })
        .getOne();

      if (isNullOrUndefined(bulletin)) {
        throw new BadRequestException(errorKeys.bulletin.Bulletin_Does_Not_Exist, {
          id: bulletinId,
        });
      }

      const updateBulletinModel = this.getUpdateBulletinModel(bulletin!, reqDto);

      if (updateBulletinModel !== null) {
        try {
          await bulletinRepository.update({ id: bulletinId } satisfies FindOptionsWhere<Bulletin>, updateBulletinModel);
        } catch (error: unknown) {
          if (this.isUniqueConstraintError(error, 'UQ_Bulletin_Date')) {
            throw new BadRequestException(errorKeys.bulletin.Bulletin_With_Given_Date_Already_Exists, {
              date: reqDto.date,
            });
          }
          throw error;
        }
      }

      // Update days if provided (including empty array which should clear all days)
      if (reqDto.days !== null && reqDto.days !== undefined) {
        const bulletinDaysRepository = entityManager.getRepository(BulletinDay);
        const bulletinDaySectionsRepository = entityManager.getRepository(BulletinDaySection);

        const existingDays = bulletin!.days || [];
        const existingDaysMap = new Map(existingDays.map(day => [day.uuid, day]));
        const dayIdsToDelete: number[] = [];
        const processedDayIds = new Set<string>();

        for (const dayDto of reqDto.days!) {
          const existingDay = dayDto.id ? existingDaysMap.get(dayDto.id) : null;

          if (!existingDay) {
            // Create new day
            const newDay = {
              bulletin: { id: bulletinId },
              date: dayDto.date ?? null,
              title: dayDto.title ?? null,
              createdBy: { id: userId } satisfies IUserId,
            } satisfies ICreateBulletinDay;

            let savedDay: BulletinDay;
            try {
              savedDay = await bulletinDaysRepository.save(newDay);
            } catch (error: unknown) {
              if (this.isUniqueConstraintError(error, 'UQ_BulletinDay_Date')) {
                throw new BadRequestException(errorKeys.bulletin.Bulletin_Day_With_Given_Date_Already_Exists, {
                  date: dayDto.date,
                });
              }
              throw error;
            }

            // Create sections for new day
            if (dayDto.sections && dayDto.sections.length > 0) {
              const sectionsToSave = dayDto.sections
                .sort((a, b) => a.order - b.order)
                .map(
                  (section: UpdateBulletinDaySectionDto, index: number) =>
                    ({
                      bulletinDay: { id: savedDay.id },
                      content: section.content,
                      order: index + 1,
                      type: section.type ?? SectionType.CUSTOM_TEXT,
                      title: section.title ?? null,
                      createdBy: { id: userId } satisfies IUserId,
                    }) satisfies ICreateBulletinDaySection,
                );

              await bulletinDaySectionsRepository.save(sectionsToSave);
            }
          } else {
            processedDayIds.add(existingDay.uuid);

            // Update existing day if needed
            const dayUpdateData: any = {};
            let shouldUpdateDay = false;

            if ((existingDay.title ?? null) !== (dayDto.title ?? null)) {
              dayUpdateData.title = dayDto.title;
              shouldUpdateDay = true;
            }
            if ((existingDay.date ?? null) !== (dayDto.date ?? null)) {
              dayUpdateData.date = dayDto.date;
              shouldUpdateDay = true;
            }

            if (shouldUpdateDay) {
              dayUpdateData.updatedBy = { id: userId } satisfies IUserId;
              try {
                await bulletinDaysRepository.update(
                  { id: existingDay.id } satisfies FindOptionsWhere<BulletinDay>,
                  dayUpdateData,
                );
              } catch (error: unknown) {
                if (this.isUniqueConstraintError(error, 'UQ_BulletinDay_Date')) {
                  throw new BadRequestException(errorKeys.bulletin.Bulletin_Day_With_Given_Date_Already_Exists, {
                    date: dayDto.date,
                  });
                }
                throw error;
              }
            }

            // Handle sections for existing day
            if (dayDto.sections) {
              const existingSections = existingDay.sections || [];
              const existingSectionsMap = new Map(existingSections.map(section => [section.uuid, section]));
              const sectionsToCreate: ICreateBulletinDaySection[] = [];
              const sectionsToUpdate: any[] = [];
              const sectionIdsToDelete: number[] = [];
              const processedSectionIds = new Set<string>();

              dayDto.sections
                .sort((a, b) => a.order - b.order)
                .forEach((sectionDto: UpdateBulletinDaySectionDto, index: number) => {
                  const order = index + 1;
                  const existingSection = sectionDto.id ? existingSectionsMap.get(sectionDto.id) : null;

                  if (!existingSection) {
                    sectionsToCreate.push({
                      bulletinDay: { id: existingDay.id },
                      content: sectionDto.content,
                      order,
                      type: sectionDto.type ?? SectionType.CUSTOM_TEXT,
                      title: sectionDto.title ?? null,
                      createdBy: { id: userId } satisfies IUserId,
                    } satisfies ICreateBulletinDaySection);
                  } else {
                    processedSectionIds.add(existingSection.uuid);

                    const sectionUpdateData: any = {};
                    let shouldUpdateSection = false;

                    if (existingSection.content !== sectionDto.content) {
                      sectionUpdateData.content = sectionDto.content;
                      shouldUpdateSection = true;
                    }
                    if ((existingSection.title ?? null) !== (sectionDto.title ?? null)) {
                      sectionUpdateData.title = sectionDto.title;
                      shouldUpdateSection = true;
                    }
                    if (existingSection.order !== order) {
                      sectionUpdateData.order = order;
                      shouldUpdateSection = true;
                    }

                    if (shouldUpdateSection) {
                      sectionUpdateData.updatedBy = { id: userId } satisfies IUserId;
                      sectionsToUpdate.push({ id: existingSection.id, data: sectionUpdateData });
                    }
                  }
                });

              // Mark sections for deletion
              existingSections.forEach(section => {
                if (!processedSectionIds.has(section.uuid)) {
                  sectionIdsToDelete.push(section.id);
                }
              });

              // Execute section operations
              if (sectionsToCreate.length > 0) {
                await bulletinDaySectionsRepository.save(sectionsToCreate);
              }

              for (const update of sectionsToUpdate) {
                await bulletinDaySectionsRepository.update(
                  { id: update.id } satisfies FindOptionsWhere<BulletinDaySection>,
                  update.data,
                );
              }

              if (sectionIdsToDelete.length > 0) {
                await bulletinDaySectionsRepository.delete(sectionIdsToDelete);
              }
            }
          }
        }

        // Mark days for deletion
        existingDays.forEach(day => {
          if (!processedDayIds.has(day.uuid)) {
            dayIdsToDelete.push(day.id);
          }
        });

        // Delete days (sections will be deleted by cascade)
        if (dayIdsToDelete.length > 0) {
          await bulletinDaysRepository.delete(dayIdsToDelete);
        }
      }
    });

    return bulletinId;
  }

  public async delete(bulletinId: number): Promise<boolean> {
    // Days and sections will be deleted by CASCADE constraints
    await this._dbContext.bulletins.delete({ id: bulletinId });
    return true;
  }

  public async publish(bulletin: Bulletin, userId: number): Promise<boolean> {
    return await this._dbContext.transaction(async transactionalEntityManager => {
      const bulletinRepository = transactionalEntityManager.getRepository(Bulletin);

      await bulletinRepository.update(
        { id: bulletin.id } satisfies FindOptionsWhere<Bulletin>,
        {
          state: BulletinState.Published,
          publishedBy: { id: userId } satisfies IUserId,
          publishedAt: new Date(),
        } satisfies QueryDeepPartialEntity<Bulletin>,
      );

      return true;
    });
  }

  private getUpdateBulletinModel(
    bulletinFromDb: Bulletin,
    dto: UpdateBulletinDto,
  ): QueryDeepPartialEntity<Bulletin> | null {
    const result: QueryDeepPartialEntity<Bulletin> = {};

    let wasChanged = false;
    if ((bulletinFromDb.title ?? null) !== (dto.title ?? null)) {
      result.title = dto.title;
      wasChanged = true;
    }

    if ((bulletinFromDb.date ?? null) !== (dto.date ?? null)) {
      result.date = dto.date;
      wasChanged = true;
    }

    if ((bulletinFromDb.number ?? null) !== (dto.number ?? null)) {
      result.number = dto.number;
      wasChanged = true;
    }

    if ((bulletinFromDb.introduction ?? null) !== (dto.introduction ?? null)) {
      result.introduction = dto.introduction;
      wasChanged = true;
    }

    if ((bulletinFromDb.tipsForWork ?? null) !== (dto.tipsForWork ?? null)) {
      result.tipsForWork = dto.tipsForWork;
      wasChanged = true;
    }

    if ((bulletinFromDb.dailyPrayer ?? null) !== (dto.dailyPrayer ?? null)) {
      result.dailyPrayer = dto.dailyPrayer;
      wasChanged = true;
    }

    return wasChanged ? result : null;
  }

  private validateUniqueBulletinDayDates(days: Array<{ date?: Date | null; id?: string }>): void {
    const dateMap = new Map<string, number>();

    days.forEach((day, index) => {
      if (isDate(day.date)) {
        const dateKey = day.date!.toISOString().slice(0, 10);
        const existingIndex = dateMap.get(dateKey);

        if (existingIndex !== undefined) {
          throw new BadRequestException(errorKeys.bulletin.Bulletin_Day_With_Given_Date_Already_Exists, {
            date: dateKey,
            firstDayIndex: existingIndex + 1,
            duplicateDayIndex: index + 1,
          });
        }

        dateMap.set(dateKey, index);
      }
    });
  }
}
