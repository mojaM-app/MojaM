import { Service } from 'typedi';
import { GetCalendarEventsDto } from '@modules/news/dtos/calendar.dto';

@Service()
export class CalendarService {
  //public users = new PrismaClient().user;

  public async get(): Promise<GetCalendarEventsDto> {
    return {};
  }
}
