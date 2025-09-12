import { BaseService, events } from '@core';
import { BadRequestException, errorKeys } from '@exceptions';
import { isDate, isEmptyString, isNullOrUndefined, isPositiveNumber } from '@utils';
import { Container, Service } from 'typedi';
import { Bulletin } from '../../../dataBase/entities/bulletin/bulletin.entity';
import { CreateBulletinReqDto } from '../dtos/create-bulletin.dto';
import { DeleteBulletinReqDto } from '../dtos/delete-bulletin.dto';
import {
  GetBulletinReqDto,
  IBulletinDayDto,
  IBulletinDaySectionDto,
  IBulletinDto,
  IBulletinSectionSettings,
} from '../dtos/get-bulletin.dto';
import { PublishBulletinReqDto } from '../dtos/publish-bulletin.dto';
import { UpdateBulletinDto, UpdateBulletinReqDto } from '../dtos/update-bulletin.dto';
import { SectionType } from '../enums/bulletin-section-type.enum';
import { BulletinCreatedEvent } from '../events/bulletin-created-event';
import { BulletinDeletedEvent } from '../events/bulletin-deleted-event';
import { BulletinPublishedEvent } from '../events/bulletin-published-event';
import { BulletinRetrievedEvent } from '../events/bulletin-retrieved-event';
import { BulletinUpdatedEvent } from '../events/bulletin-updated-event';
import { BulletinRepository } from '../repositories/bulletin.repository';

@Service()
export class BulletinService extends BaseService {
  private readonly _bulletinRepository: BulletinRepository;

  constructor() {
    super();
    this._bulletinRepository = Container.get(BulletinRepository);
  }

  public async get(reqDto: GetBulletinReqDto): Promise<IBulletinDto | null> {
    const bulletin = await this._bulletinRepository.getByUuid(reqDto.bulletinUuid);

    if (isNullOrUndefined(bulletin)) {
      throw new BadRequestException(errorKeys.bulletin.Bulletin_Does_Not_Exist, {
        id: reqDto.bulletinUuid,
      });
    }

    const dto = this.bulletinToIBulletin(bulletin!);

    this._eventDispatcher.dispatch(
      events.bulletin.bulletinRetrieved,
      new BulletinRetrievedEvent(dto, reqDto.currentUserId!),
    );

    return dto;
  }

  public async create(reqDto: CreateBulletinReqDto): Promise<IBulletinDto | null> {
    const bulletinModel = reqDto.bulletin;

    if (isNullOrUndefined(bulletinModel)) {
      return null;
    }

    if (!isDate(bulletinModel.date)) {
      throw new BadRequestException(errorKeys.bulletin.Date_Is_Required, {
        date: bulletinModel.date,
      });
    }

    if (!isPositiveNumber(bulletinModel.number)) {
      throw new BadRequestException(errorKeys.bulletin.Number_Is_Required, {
        number: bulletinModel.number,
      });
    }

    if (isNullOrUndefined(bulletinModel.title) || isEmptyString(bulletinModel.title)) {
      throw new BadRequestException(errorKeys.bulletin.Title_Is_Required, {
        title: bulletinModel.title,
      });
    }

    const existBulletinWithSameDate = await this._bulletinRepository.checkIfExistWithDate(bulletinModel.date);
    if (existBulletinWithSameDate) {
      throw new BadRequestException(errorKeys.bulletin.Bulletin_With_Given_Date_Already_Exists, {
        date: bulletinModel.date,
      });
    }

    const { id: bulletinId } = await this._bulletinRepository.create(bulletinModel, reqDto.currentUserId!);
    const bulletin = await this._bulletinRepository.get(bulletinId);
    const dto = this.bulletinToIBulletin(bulletin!);

    this._eventDispatcher.dispatch(
      events.bulletin.bulletinCreated,
      new BulletinCreatedEvent(dto, reqDto.currentUserId!),
    );

    return dto;
  }

  public async update(reqDto: UpdateBulletinReqDto): Promise<IBulletinDto | null> {
    if (isNullOrUndefined(reqDto.bulletinId)) {
      throw new BadRequestException(errorKeys.bulletin.Bulletin_Does_Not_Exist);
    }

    const bulletinModel = reqDto.bulletin;

    if (isDate(bulletinModel.date)) {
      const existBulletinWithSameDate = await this._bulletinRepository.checkIfExistWithDate(
        bulletinModel.date,
        reqDto.bulletinId,
      );
      if (existBulletinWithSameDate) {
        throw new BadRequestException(errorKeys.bulletin.Bulletin_With_Given_Date_Already_Exists, {
          date: bulletinModel.date,
        });
      }
    }

    const bulletin = await this._bulletinRepository.getByUuid(reqDto.bulletinId!);

    if (isNullOrUndefined(bulletin)) {
      throw new BadRequestException(errorKeys.bulletin.Bulletin_Does_Not_Exist, {
        id: reqDto.bulletinId,
      });
    }

    if (bulletin!.isPublished) {
      this.validateBulletinForPublication(bulletinModel);
    }

    await this._bulletinRepository.update(bulletinModel, bulletin!.id, reqDto.currentUserId!);
    const updatedBulletin = await this._bulletinRepository.get(bulletin!.id);
    const dto = this.bulletinToIBulletin(updatedBulletin!);

    this._eventDispatcher.dispatch(
      events.bulletin.bulletinUpdated,
      new BulletinUpdatedEvent(dto, reqDto.currentUserId!),
    );

    return dto;
  }

  public async delete(reqDto: DeleteBulletinReqDto): Promise<boolean> {
    const bulletin = await this._bulletinRepository.getByUuid(reqDto.bulletinId);

    if (isNullOrUndefined(bulletin)) {
      throw new BadRequestException(errorKeys.bulletin.Bulletin_Does_Not_Exist, {
        id: reqDto.bulletinId,
      });
    }

    // Check if bulletin can be deleted (not published, no dependencies, etc.)
    // For now we just delete it

    const result = await this._bulletinRepository.delete(bulletin!.id);

    this._eventDispatcher.dispatch(
      events.bulletin.bulletinDeleted,
      new BulletinDeletedEvent(this.bulletinToIBulletin(bulletin!), reqDto.currentUserId!),
    );

    return result;
  }

  public async publish(reqDto: PublishBulletinReqDto): Promise<boolean> {
    const bulletin = await this._bulletinRepository.getByUuid(reqDto.bulletinId);

    if (isNullOrUndefined(bulletin)) {
      throw new BadRequestException(errorKeys.bulletin.Bulletin_Does_Not_Exist, {
        id: reqDto.bulletinId,
      });
    }

    if (bulletin!.isPublished) {
      return true;
    }

    this.validateBulletinForPublication(bulletin!);

    const result = await this._bulletinRepository.publish(bulletin!, reqDto.currentUserId!);

    this._eventDispatcher.dispatch(
      events.bulletin.bulletinPublished,
      new BulletinPublishedEvent(this.bulletinToIBulletin(bulletin!), reqDto.currentUserId!),
    );

    return result;
  }

  private validateBulletinForPublication(bulletin: Bulletin | UpdateBulletinDto): void {
    // Check required bulletin fields
    if (isNullOrUndefined(bulletin.title) || isEmptyString(bulletin.title)) {
      throw new BadRequestException(errorKeys.bulletin.Title_Is_Required);
    }

    if (!isDate(bulletin.date)) {
      throw new BadRequestException(errorKeys.bulletin.Date_Is_Required);
    }

    if (!isPositiveNumber(bulletin.number)) {
      throw new BadRequestException(errorKeys.bulletin.Number_Is_Required);
    }

    // Check if bulletin has at least one day
    if (isNullOrUndefined(bulletin.days) || bulletin.days!.length === 0) {
      throw new BadRequestException(errorKeys.bulletin.Bulletin_Must_Have_At_Least_One_Day);
    }

    let checkBulletinIntroduction = false;
    let checkBulletinTipsForWork = false;
    let checkBulletinDailyPrayer = false;

    // Validate each day
    bulletin.days!.forEach((day, dayIndex) => {
      // Check day required fields
      if (!isDate(day.date)) {
        throw new BadRequestException(errorKeys.bulletin.Day_Date_Is_Required, {
          dayIndex: dayIndex + 1,
        });
      }

      if (isNullOrUndefined(day.title) || isEmptyString(day.title)) {
        throw new BadRequestException(errorKeys.bulletin.Day_Title_Is_Required, {
          dayIndex: dayIndex + 1,
        });
      }

      // Check if day has sections
      if (isNullOrUndefined(day.sections) || day.sections!.length === 0) {
        throw new BadRequestException(errorKeys.bulletin.Day_Must_Have_At_Least_One_Section, {
          dayIndex: dayIndex + 1,
        });
      }

      // Validate sections according to business rules
      day.sections!.forEach((section, sectionIndex) => {
        if (isNullOrUndefined(section.type)) {
          throw new BadRequestException(errorKeys.bulletin.Section_Type_Is_Required, {
            dayIndex: dayIndex + 1,
            sectionIndex: sectionIndex + 1,
          });
        }

        if (section.type === SectionType.INTRODUCTION) {
          checkBulletinIntroduction = true;
        }

        if (section.type === SectionType.TIPS_FOR_WORK) {
          checkBulletinTipsForWork = true;
        }

        if (section.type === SectionType.DAILY_PRAYER) {
          checkBulletinDailyPrayer = true;
        }

        // Validate section content based on type
        if (section.type === SectionType.CUSTOM_TEXT) {
          // CUSTOM_TEXT requires title and content
          if (isNullOrUndefined(section.title) || isEmptyString(section.title)) {
            throw new BadRequestException(errorKeys.bulletin.Custom_Section_Title_Is_Required, {
              dayIndex: dayIndex + 1,
              sectionIndex: sectionIndex + 1,
            });
          }
          if (isNullOrUndefined(section.content) || isEmptyString(section.content)) {
            throw new BadRequestException(errorKeys.bulletin.Custom_Section_Content_Is_Required, {
              dayIndex: dayIndex + 1,
              sectionIndex: sectionIndex + 1,
            });
          }
        } else {
          // Other section types should have null title and content
          if (!isNullOrUndefined(section.title) && !isEmptyString(section.title)) {
            throw new BadRequestException(errorKeys.bulletin.Non_Custom_Section_Should_Not_Have_Title, {
              dayIndex: dayIndex + 1,
              sectionIndex: sectionIndex + 1,
              type: section.type,
            });
          }
          if (!isNullOrUndefined(section.content) && !isEmptyString(section.content)) {
            throw new BadRequestException(errorKeys.bulletin.Non_Custom_Section_Should_Not_Have_Content, {
              dayIndex: dayIndex + 1,
              sectionIndex: sectionIndex + 1,
              type: section.type,
            });
          }
        }
      });
    });

    if (
      checkBulletinIntroduction &&
      (isNullOrUndefined(bulletin.introduction) || isEmptyString(bulletin.introduction))
    ) {
      throw new BadRequestException(errorKeys.bulletin.Introduction_Is_Required);
    }

    if (checkBulletinTipsForWork && (isNullOrUndefined(bulletin.tipsForWork) || isEmptyString(bulletin.tipsForWork))) {
      throw new BadRequestException(errorKeys.bulletin.Tips_For_Work_Is_Required);
    }

    if (checkBulletinDailyPrayer && (isNullOrUndefined(bulletin.dailyPrayer) || isEmptyString(bulletin.dailyPrayer))) {
      throw new BadRequestException(errorKeys.bulletin.Daily_Prayer_Is_Required);
    }
  }

  private bulletinToIBulletin(bulletin: Bulletin): IBulletinDto {
    return {
      id: bulletin.uuid,
      date: bulletin.date,
      title: bulletin.title,
      dailyPrayer: bulletin.dailyPrayer,
      tipsForWork: bulletin.tipsForWork,
      introduction: bulletin.introduction,
      number: bulletin.number,
      state: bulletin.state,
      createdAt: bulletin.createdAt,
      createdBy: bulletin.createdBy.getFirstLastName()!,
      updatedAt: bulletin.updatedAt,
      updatedBy: bulletin.updatedBy?.getFirstLastName() ?? bulletin.createdBy.getFirstLastName(),
      publishedAt: bulletin.publishedAt,
      publishedBy: bulletin.publishedBy ? bulletin.publishedBy.getFirstLastName() : null,
      days: bulletin.days.map(
        day =>
          ({
            id: day.uuid,
            date: day.date,
            title: day.title,
            sections: day.sections
              .sort((a, b) => a.order - b.order)
              .map(
                section =>
                  ({
                    id: section.uuid,
                    title: section.title,
                    content: section.content,
                    type: section.type as SectionType,
                    order: section.order,
                    settings: section.settings as IBulletinSectionSettings,
                  }) satisfies IBulletinDaySectionDto,
              ),
          }) satisfies IBulletinDayDto,
      ),
    } satisfies IBulletinDto;
  }
}
