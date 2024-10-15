import { events } from '@events';
import { IResponse } from '@interfaces';

export interface ICalendarEventDto {
  start: Date | undefined;
  end: Date | undefined;
  title: string | null | undefined;
  location: string | null | undefined;
  allDay: boolean;
}

export class GetCalendarEventsResponseDto implements IResponse<ICalendarEventDto[]> {
  public readonly data: ICalendarEventDto[];
  public readonly message?: string | undefined;

  public constructor(data: ICalendarEventDto[]) {
    this.data = data;
    this.message = events.calendar.retrieved;
  }
}
