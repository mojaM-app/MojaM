import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { IGetCurrentAnnouncements } from 'src/app/components/announcements/interfaces/current-announcements';
import { BaseService } from '../../../../services/common/base.service';
import { HttpClientService } from '../../../../services/common/httpClient.service';
import { SpinnerService } from '../../../../services/spinner/spinner.service';

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
              resp.currentAnnouncements.validFromDate = this.toDateTime(
                resp.currentAnnouncements.validFromDate
              )!;
              resp.currentAnnouncements.createdAt = this.toDateTime(
                resp.currentAnnouncements.createdAt
              )!;
              resp.currentAnnouncements.updatedAt = this.toDateTime(
                resp.currentAnnouncements.updatedAt
              )!;
              resp.currentAnnouncements.publishedAt = this.toDateTime(
                resp.currentAnnouncements.publishedAt
              )!;
              resp.currentAnnouncements.items?.forEach(item => {
                item.createdAt = this.toDateTime(item.createdAt)!;
                item.updatedAt = this.toDateTime(item.updatedAt)!;
                item.getAuthorName = (): string => {
                  return item.updatedBy ?? item.createdBy ?? '';
                };
                item.getCreationDateTime = (): Date => {
                  return item.updatedAt ?? item.createdAt;
                };
              });
              resp.currentAnnouncements.getPublisherName = (): string => {
                return resp.currentAnnouncements!.publishedBy ?? '';
              };
              resp.currentAnnouncements.getPublishDateTime = (): Date | undefined | null => {
                return resp.currentAnnouncements!.publishedAt;
              };
            }
          }

          return resp ?? { currentAnnouncements: null, announcementsCount: 0 };
        })
      );
  }
}
