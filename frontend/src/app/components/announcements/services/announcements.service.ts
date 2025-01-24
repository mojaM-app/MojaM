import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AddAnnouncementsDto } from 'src/app/components/announcements/models/add-announcements.model';
import { BaseService } from '../../../../services/common/base.service';
import { HttpClientService } from '../../../../services/common/httpClient.service';
import { SpinnerService } from '../../../../services/spinner/spinner.service';
import { IAnnouncements } from '../interfaces/announcements';
import { EditAnnouncementsDto } from '../models/edit-announcements.model';

@Injectable({
  providedIn: 'root',
})
export class AnnouncementsService extends BaseService {
  public constructor(
    private _httpClient: HttpClientService,
    private _spinnerService: SpinnerService
  ) {
    super();
  }

  public create(model: AddAnnouncementsDto): Observable<string | null> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.announcements.create())
      .withBody({ ...model })
      .post<string | null>()
      .pipe(
        this._spinnerService.waitForSubscription(),
        map((resp: string | null) => {
          return resp ?? null;
        })
      );
  }

  public get(uuid: string): Observable<IAnnouncements> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.announcements.get(uuid))
      .get<IAnnouncements>()
      .pipe(
        this._spinnerService.waitForSubscription(),
        map((resp: IAnnouncements) => {
          if (resp) {
            resp.validFromDate = resp.validFromDate ? new Date(resp.validFromDate) : null;
            resp.createdAt = new Date(resp.createdAt);
            resp.updatedAt = new Date(resp.updatedAt);
            resp.publishedAt = resp.publishedAt ? new Date(resp.publishedAt) : undefined;
            resp.items?.forEach(item => {
              item.createdAt = new Date(item.createdAt);
              item.updatedAt = item.updatedAt ? new Date(item.updatedAt) : undefined;
              item.getAuthorName = (): string => {
                return item.updatedBy ?? item.createdBy ?? '';
              };
              item.getCreationDateTime = (): Date => {
                return item.updatedAt ?? item.createdAt;
              };
            });
          }

          return resp;
        })
      );
  }

  public update(model: EditAnnouncementsDto): Observable<string | null> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.announcements.update(model.id!))
      .withBody({ ...model })
      .put<string | null>()
      .pipe(
        this._spinnerService.waitForSubscription(),
        map((resp: string | null) => {
          return resp ?? null;
        })
      );
  }
}
