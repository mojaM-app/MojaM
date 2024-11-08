import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { ICurrentAnnouncements } from 'src/interfaces/announcements/announcements';
import { BaseService } from '../common/base.service';
import { HttpClientService } from '../common/httpClient.service';
import { SpinnerService } from '../spinner/spinner.service';

@Injectable({
  providedIn: 'root',
})
export class CurrentAnnouncementsService extends BaseService {
  public constructor(
    private _httpClient: HttpClientService,
    private _spinnerService: SpinnerService
  ) {
    super();
  }

  public get(): Observable<ICurrentAnnouncements | null> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.announcements.getCurrent())
      .get<ICurrentAnnouncements | null>()
      .pipe(
        this._spinnerService.waitForSubscription(),
        map((resp: ICurrentAnnouncements | null) => {
          if (resp) {
            resp.validFromDate = new Date(resp.validFromDate);
          }
          return resp ?? null;
        })
      );
  }
}
