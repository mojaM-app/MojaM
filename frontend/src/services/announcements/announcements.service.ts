import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { ICurrentAnnouncements } from 'src/interfaces/announcements/announcements';
import { BaseService } from '../common/base.service';
import { HttpClientService } from '../common/httpClient.service';

@Injectable({
  providedIn: 'root',
})
export class AnnouncementsService extends BaseService {
  public constructor(private _httpClient: HttpClientService) {
    super();
  }

  public get(): Observable<ICurrentAnnouncements | null> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.announcements.getCurrent())
      .get<ICurrentAnnouncements | null>()
      .pipe(
        map((resp: ICurrentAnnouncements | null) => {
          if (resp) {
            resp.validFromDate =
              resp.validFromDate !== undefined && resp.validFromDate !== null
                ? new Date(resp.validFromDate)
                : undefined;
          }
          return resp ?? null;
        })
      );
  }
}
