import { events } from '@events';
import { IResponse } from '@interfaces';

export class GetCalendarEventsDto {}

export class GetCalendarEventsResponseDto implements IResponse<GetCalendarEventsDto> {
  public readonly data: GetCalendarEventsDto;
  public readonly message?: string | undefined;

  public constructor(data: GetCalendarEventsDto) {
    this.data = data;
    this.message = events.news.calendar.retrieved;
  }
}
