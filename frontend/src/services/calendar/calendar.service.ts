import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CalendarEvent, ICalendarEvent } from 'src/interfaces/calendar/calendar-event';
import { BaseService } from '../common/base.service';
import { HttpClientService } from '../common/httpClient.service';
import { SpinnerService } from '../spinner/spinner.service';

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

  public getEvents(start: Date, end: Date): Observable<CalendarEvent[]> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.calendar.getEvents())
      .withParams({ start: start.toISOString(), end: end.toISOString() })
      .get<ICalendarEvent[]>()
      .pipe(
        this._spinnerService.waitForSubscription(),
        map((events: ICalendarEvent[]) => {
          return events.map(event => {
            return {
              start: this.toDateTime(event.start),
              end: this.toDateTime(event.end),
              title: event.title ?? '',
              allDay: event.allDay ?? false,
              location: event.location,
            } satisfies CalendarEvent;
          });
        })
      );
  }

  private toDateTime(date: string | null | undefined): Date {
    if (!date) {
      return new Date();
    }

    return new Date(date);
  }
}
