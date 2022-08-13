import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { delay, of } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class MissionService extends BaseService {
  public constructor(private _http: HttpClient) {
    super();
  }

  public getMeetings(): Observable<string> {
    const meetings = 'Wspólnota Miriam spotyka się w każdą środę';
    return of(meetings).pipe(delay(1000));

    //return this._http.get<string>(this.API_ROUTES.community.getMeetings());
  }
}
