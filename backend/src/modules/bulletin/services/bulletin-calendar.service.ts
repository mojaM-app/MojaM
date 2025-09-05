import { BaseService } from '@core';
import { Container, Service } from 'typedi';
import { GetBulletinDaysMinMaxDateReqDto, IBulletinDaysMinMaxDto } from '../dtos/get-bulletin-days-min-max-date.dto';
import { BulletinDaysRepository } from '../repositories/bulletin-days.repository';

@Service()
export class BulletinCalendarService extends BaseService {
  private readonly _repository: BulletinDaysRepository;

  constructor() {
    super();
    this._repository = Container.get(BulletinDaysRepository);
  }

  public async getMinMaxDate(reqDto: GetBulletinDaysMinMaxDateReqDto): Promise<IBulletinDaysMinMaxDto> {
    const minMaxDate: IBulletinDaysMinMaxDto = await this._repository.getMinMaxDate();

    return {
      minDate: minMaxDate.minDate,
      maxDate: minMaxDate.maxDate,
    };
  }
}
