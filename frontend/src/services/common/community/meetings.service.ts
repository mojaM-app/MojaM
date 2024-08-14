import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { IGetMeetingsResponse } from '../../../interfaces/community/meetings';
import { BaseService } from '../base.service';
import { HttpClientService } from '../httpClient.service';

@Injectable({
  providedIn: 'root',
})
export class MeetingsService extends BaseService {
  public constructor(private _httpClient: HttpClientService) {
    super();
  }

  public get(): Observable<string> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.community.getMeetings())
      .get<IGetMeetingsResponse>()
      .pipe(
        map((response: IGetMeetingsResponse) => response.data),
        map((resp: string) => {
          return resp;
        })
      );
  }
}
