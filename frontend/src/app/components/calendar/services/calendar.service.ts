import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  ICalendarEvent,
  ICalendarEventDto,
} from 'src/app/components/calendar/interfaces/calendar-event';
import { BaseService } from '../../../../services/common/base.service';
import { HttpClientService } from '../../../../services/common/httpClient.service';
import { SpinnerService } from '../../../../services/spinner/spinner.service';

@Injectable({
  providedIn: 'root',
})
export class CalendarService extends BaseService {
  public constructor(
    private _httpClient: HttpClientService,
    private _spinnerService: SpinnerService
  ) {
    super();
  }

  public getEvents(start: Date, end: Date): Observable<ICalendarEvent[]> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.calendar.getEvents())
      .withParams({ start: start.toISOString(), end: end.toISOString() })
      .get<ICalendarEventDto[]>()
      .pipe(
        this._spinnerService.waitForSubscription(),
        map((events: ICalendarEventDto[]) => {
          return events.map(event => {
            return {
              start: this.toDateTime(event.start) ?? new Date(),
              end: this.toDateTime(event.end) ?? new Date(),
              title: event.title ?? '',
              allDay: event.allDay ?? false,
              location: event.location,
            } satisfies ICalendarEvent;
          });
        })
      );
  }
}
