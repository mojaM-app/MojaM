import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { IGetCurrentAnnouncements } from 'src/interfaces/announcements/current-announcements';
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

  public get(): Observable<IGetCurrentAnnouncements> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.announcements.getCurrent())
      .get<IGetCurrentAnnouncements>()
      .pipe(
        this._spinnerService.waitForSubscription(),
        map((resp: IGetCurrentAnnouncements) => {
          if (resp) {
            resp.currentAnnouncements = resp.currentAnnouncements ?? null;
            if (resp.currentAnnouncements) {
              resp.currentAnnouncements.validFromDate = new Date(
                resp.currentAnnouncements.validFromDate
              );
              resp.currentAnnouncements.createdAt = new Date(resp.currentAnnouncements.createdAt);
              resp.currentAnnouncements.updatedAt = new Date(resp.currentAnnouncements.updatedAt);
              resp.currentAnnouncements.publishedAt = new Date(
                resp.currentAnnouncements.publishedAt
              );
              resp.currentAnnouncements.items?.forEach(item => {
                item.createdAt = new Date(item.createdAt);
                item.updatedAt = new Date(item.updatedAt);
              });
            }
          }

          return resp ?? { currentAnnouncements: null, announcementsCount: 0 };
        })
      );
  }
}
