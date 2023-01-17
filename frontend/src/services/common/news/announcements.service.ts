import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { Announcements } from 'src/models/news/announcements/announcements';
import { BaseService } from '../base.service';

@Injectable({
  providedIn: 'root'
})
export class AnnouncementsService extends BaseService {
  public constructor(private _http: HttpClient) {
    super();
  }

  public get(): Observable<Announcements> {
    return this._http.get<Announcements>(this.API_ROUTES.news.getAnnouncements())
    .pipe(
      map(resp => {
        resp.date = new Date(resp.date);
        return resp;
      })
    );
  }
}
