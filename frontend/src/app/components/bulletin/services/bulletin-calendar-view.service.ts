import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BaseService } from '../../../../services/common/base.service';
import { HttpClientService } from '../../../../services/common/httpClient.service';
import { SpinnerService } from '../../../../services/spinner/spinner.service';
import {
  IBulletinCalendarDay,
  IBulletinCalendarDayDto,
  IBulletinDaysMinMaxDto,
} from '../interfaces/bulletin-calendar-view.interfaces';

@Injectable({
  providedIn: 'root',
})
export class BulletinCalendarViewService extends BaseService {
  public constructor(
    private _httpClient: HttpClientService,
    private _spinnerService: SpinnerService
  ) {
    super();
  }

  public getMinMaxDate(): Observable<IBulletinDaysMinMaxDto> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.bulletinCalendarView.getMinMaxDate())
      .get<IBulletinDaysMinMaxDto>()
      .pipe(
        this._spinnerService.waitForSubscription(),
        map((resp: IBulletinDaysMinMaxDto) => {
          if (resp) {
            resp.minDate = this.toDate(resp.minDate)!;
            resp.maxDate = this.toDate(resp.maxDate)!;
          }
          return resp;
        })
      );
  }

  public getDays(start: Date, end: Date): Observable<IBulletinCalendarDay[]> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.bulletinCalendarView.getDays())
      .withParams({ start: start.toISOString(), end: end.toISOString() })
      .get<IBulletinCalendarDayDto[]>()
      .pipe(
        this._spinnerService.waitForSubscription(),
        map((days: IBulletinCalendarDayDto[]) => {
          return days.map(dto => {
            return {
              id: dto.id,
              bulletinId: dto.bulletinId,
              title: dto.title,
              start: this.toDate(dto.date)!,
              end: this.toDate(dto.date)!,
              allDay: true,
              isFirstDay: dto.isFirstDay,
              isLastDay: dto.isLastDay,
            } satisfies IBulletinCalendarDay;
          });
        })
      );
  }
}
