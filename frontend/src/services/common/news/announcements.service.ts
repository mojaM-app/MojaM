import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { BaseService } from '../base.service';

@Injectable({
  providedIn: 'root'
})
export class AnnouncementsService extends BaseService {
  public constructor(private _http: HttpClient) {
    super();
  }

  public get(): Observable<string[]> {
    return this._http.get<string[]>(this.API_ROUTES.news.getAnnouncements());
  }
}
