import { BaseRepository } from '@db';
import { Service } from 'typedi';
import { getMonthBounds } from 'utils/date.utils';
import { IBulletinDaysMinMaxDto } from '../dtos/get-bulletin-days-min-max-date.dto';

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
}
