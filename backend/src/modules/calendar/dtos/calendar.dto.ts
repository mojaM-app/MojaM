import { BaseReqDto, events, IResponse } from '@core';

export class GetCalendarEventsReqDto extends BaseReqDto {
  public readonly startDate: Date;
  public readonly endDate: Date;

  constructor(startDate: string | undefined, endDate: string | undefined, currentUserId: number | undefined) {
    super(currentUserId);
    this.startDate = new Date(startDate ?? new Date().toISOString());
    this.endDate = new Date(endDate ?? new Date().toISOString());
  }
}

export interface ICalendarEventDto {
  start: Date | undefined;
  end: Date | undefined;
  title: string | null | undefined;
  location: string | null | undefined;
  allDay: boolean;
}

export class GetCalendarEventsResponseDto implements IResponse<ICalendarEventDto[]> {
  public readonly data: ICalendarEventDto[];
  public readonly message: string;

  constructor(data: ICalendarEventDto[]) {
    this.data = data;
    this.message = events.calendar.eventsRetrieved;
  }
}
