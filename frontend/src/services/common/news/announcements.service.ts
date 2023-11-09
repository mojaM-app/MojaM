import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { IAnnouncements, IGetAnnouncementsResponse } from 'src/interfaces/news/announcements/announcements';
import { BaseService } from '../base.service';

@Injectable({
  providedIn: 'root',
})
export class AnnouncementsService extends BaseService {
  public constructor(private _http: HttpClient) {
    super();
  }

  public get(): Observable<IAnnouncements> {
    return this._http.get<IGetAnnouncementsResponse>(this.API_ROUTES.news.getAnnouncements()).pipe(
      map((response: IGetAnnouncementsResponse) => response.data),
      map((resp: IAnnouncements) => {
        resp.date = new Date(resp.date);
        return resp;
      })
    );
  }
}
