import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { IGetMissionResponse } from '../../../interfaces/community/mission';
import { BaseService } from '../base.service';
import { HttpClientService } from '../httpClient.service';

@Injectable({
  providedIn: 'root',
})
export class MissionService extends BaseService {
  public constructor(private _httpClient: HttpClientService) {
    super();
  }

  public get(): Observable<string> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.community.getMission())
      .get<IGetMissionResponse>()
      .pipe(
        map((response: IGetMissionResponse) => response.data),
        map((resp: string) => {
          return resp;
        })
      );
  }
}
