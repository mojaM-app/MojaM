import { BaseService } from '@modules/common';
import { GetCalendarEventsDto } from '@modules/news';
import { Service } from 'typedi';

@Service()
export class CalendarService extends BaseService {
  //public users = DbClient.getDbContext().user;

  public async get(): Promise<GetCalendarEventsDto> {
    return {};
  }
}
