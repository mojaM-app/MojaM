import { BaseRepository } from '@db';
import { getMonthBounds } from '@utils';
import { BulletinDaySection } from 'dataBase/entities/bulletin/bulletin-day-section.entity';
import { BulletinDay } from 'dataBase/entities/bulletin/bulletin-day.entity';
import { Bulletin } from 'dataBase/entities/bulletin/bulletin.entity';
import { Service } from 'typedi';
import { Between, FindOneOptions, FindOptionsOrder, FindOptionsWhere } from 'typeorm';
import { vBulletinDay } from '../../../dataBase/entities/bulletin/vBulletinDay.entity';
import { IBulletinCalendarDayWithSectionsDto, IBulletinDaySectionDto } from '../dtos/get-bulletin-day.dto';
import { IBulletinDaysMinMaxDto } from '../dtos/get-bulletin-days-min-max-date.dto';
import { IBulletinCalendarDayDto } from '../dtos/get-bulletin-days.dto';
import { SectionType } from '../enums/bulletin-section-type.enum';

@Service()
export class BulletinDaysRepository extends BaseRepository {
  constructor() {
    super();
  }

  public async getMinMaxDate(): Promise<IBulletinDaysMinMaxDto> {
    const result = await this._dbContext.vBulletinDays
      .createQueryBuilder('days')
      .select('MIN(days.date)', 'minDate')
      .addSelect('MAX(days.date)', 'maxDate')
      .getRawOne();

    const { firstDay, lastDay } = getMonthBounds();

    return {
      minDate: result?.minDate || firstDay,
      maxDate: result?.maxDate || lastDay,
    };
  }

  public async getDays(startDate: Date, endDate: Date): Promise<IBulletinCalendarDayDto[]> {
    const options: FindOneOptions<vBulletinDay> = {
      where: {
        date: Between(startDate, endDate),
      } satisfies FindOptionsWhere<vBulletinDay>,
      order: {
        date: 'ASC',
      } satisfies FindOptionsOrder<vBulletinDay>,
    };

    const result = await this._dbContext.vBulletinDays.find(options);

    return result.map(
      day =>
        ({
          id: day.id,
          bulletinId: day.bulletinId,
          title: day.title,
          date: day.date.toISOString(),
        }) satisfies IBulletinCalendarDayDto,
    );
  }

  public async getDayByUuid(dayId: string): Promise<IBulletinCalendarDayWithSectionsDto> {
    const options: FindOneOptions<BulletinDay> = {
      where: {
        uuid: dayId,
      } satisfies FindOptionsWhere<BulletinDay>,
      relations: {
        bulletin: {
          createdBy: true,
          updatedBy: true,
          publishedBy: true,
        },
        createdBy: true,
        updatedBy: true,
        sections: {
          createdBy: true,
          updatedBy: true,
        },
      },
    };

    const day = await this._dbContext.bulletinDays.findOne(options);

    if (!day) {
      throw new Error(`Bulletin day with ID ${dayId} not found`);
    }

    return {
      id: day.uuid,
      bulletinId: day.bulletin.uuid,
      createdAt: day.createdAt,
      createdBy: day.createdBy.getFirstLastName()!,
      updatedAt: day.updatedAt,
      updatedBy: day.updatedBy?.getFirstLastName() ?? day.createdBy.getFirstLastName(),
      title: day.title!,
      date: day.date!.toISOString(),
      sections: day.sections
        .sort((a, b) => a.order - b.order)
        .map(
          section =>
            ({
              id: section.uuid,
              title: section.title,
              type: section.type,
              content: this.getSectionContent(section, day.bulletin),
              order: section.order,
              settings: section.settings,
              createdAt: section.createdAt,
              createdBy: section.createdBy.getFirstLastName()!,
              updatedAt: section.updatedAt,
              updatedBy: section.updatedBy?.getFirstLastName() ?? section.createdBy.getFirstLastName(),
            }) satisfies IBulletinDaySectionDto,
        ),
    } satisfies IBulletinCalendarDayWithSectionsDto;
  }

  private getSectionContent(section: BulletinDaySection, bulletin: Bulletin): string | null {
    switch (section.type) {
      case SectionType.DAILY_PRAYER:
        return bulletin.dailyPrayer;

      case SectionType.INTRODUCTION:
        return bulletin.introduction;

      case SectionType.TIPS_FOR_WORK:
        return bulletin.tipsForWork;

      default:
        return section.content;
    }
  }
}
