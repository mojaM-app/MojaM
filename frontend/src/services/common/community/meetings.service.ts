import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { IGetMeetingsResponse } from '../../../interfaces/community/meetings';
import { BaseService } from '../base.service';

@Injectable({
  providedIn: 'root',
})
export class MeetingsService extends BaseService {
  public constructor(private _http: HttpClient) {
    super();
  }

  public get(): Observable<string> {
    return this._http.get<IGetMeetingsResponse>(this.API_ROUTES.community.getMeetings()).pipe(
      map((response: IGetMeetingsResponse) => response.data),
      map((resp: string) => {
        return resp;
      })
    );
  }
}
