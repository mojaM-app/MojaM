import { events } from '@events';
import { IResponse } from '@interfaces';

export class GetCalendarEventsDto {}

export class GetCalendarEventsResponseDto implements IResponse<GetCalendarEventsDto> {
  data: GetCalendarEventsDto;
  message?: string | undefined;

  public constructor(data: GetCalendarEventsDto) {
    this.data = data;
    this.message = events.news.calendar.retrieved;
  }
}
