import { BaseService } from '@modules/common';
import { GetCalendarEventsDto } from '@modules/news';
import { Service } from 'typedi';

@Service()
export class CalendarService extends BaseService {
  public async get(): Promise<GetCalendarEventsDto> {
    return await new Promise(resolve => {
      resolve({} satisfies GetCalendarEventsDto);
    });
  }
}
