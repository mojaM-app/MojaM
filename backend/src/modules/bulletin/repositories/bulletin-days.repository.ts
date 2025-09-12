import { BaseRepository } from '@db';
import { getMonthBounds } from '@utils';
import { Service } from 'typedi';
import { Between, FindOneOptions, FindOptionsOrder, FindOptionsWhere } from 'typeorm';
import { vBulletinDay } from '../../../dataBase/entities/bulletin/vBulletinDay.entity';
import { IBulletinDaysMinMaxDto } from '../dtos/get-bulletin-days-min-max-date.dto';
import { IBulletinCalendarDayDto } from '../dtos/get-bulletin-days.dto';

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
          isFirstDay: day.isFirstDay,
          isLastDay: day.isLastDay,
        }) satisfies IBulletinCalendarDayDto,
    );
  }
}
