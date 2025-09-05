import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BaseService } from '../../../../services/common/base.service';
import { HttpClientService } from '../../../../services/common/httpClient.service';
import { SpinnerService } from '../../../../services/spinner/spinner.service';
import { IBulletinDaysMinMaxDto } from '../interfaces/bulletin-calendar-view.interfaces';

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
            resp.minDate = this.toDateTime(resp.minDate)!;
            resp.maxDate = this.toDateTime(resp.maxDate)!;
          }
          return resp;
        })
      );
  }
}
