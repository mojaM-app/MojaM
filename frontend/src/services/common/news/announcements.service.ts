import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import {
  IAnnouncements,
  IGetAnnouncementsResponse,
} from '../../../interfaces/news/announcements/announcements';
import { BaseService } from '../base.service';
import { HttpClientService } from '../httpClient.service';

@Injectable({
  providedIn: 'root',
})
export class AnnouncementsService extends BaseService {
  public constructor(private _httpClient: HttpClientService) {
    super();
  }

  public get(): Observable<IAnnouncements> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.news.getAnnouncements())
      .get<IGetAnnouncementsResponse>()
      .pipe(
        map((response: IGetAnnouncementsResponse) => response.data),
        map((resp: IAnnouncements) => {
          resp.date = new Date(resp.date);
          return resp;
        })
      );
  }
}
