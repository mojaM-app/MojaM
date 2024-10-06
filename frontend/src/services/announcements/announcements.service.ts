import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { IAnnouncements } from 'src/interfaces/news/announcements/announcements';
import { BaseService } from '../common/base.service';
import { HttpClientService } from '../common/httpClient.service';

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
      .get<IAnnouncements>()
      .pipe(
        map((resp: IAnnouncements) => {
          resp.date = new Date(resp.date);
          return resp;
        })
      );
  }
}
