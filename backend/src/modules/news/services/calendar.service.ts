import { BaseService } from '@modules/common/base.service';
import { GetCalendarEventsDto } from '@modules/news/dtos/calendar.dto';
import { Service } from 'typedi';

@Service()
export class CalendarService extends BaseService {
  //public users = new PrismaClient().user;

  public async get(): Promise<GetCalendarEventsDto> {
    return {};
  }
}
