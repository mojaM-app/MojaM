import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { IGetMissionResponse } from '../../../interfaces/community/mission';
import { BaseService } from '../base.service';

@Injectable({
  providedIn: 'root',
})
export class MissionService extends BaseService {
  public constructor(private _http: HttpClient) {
    super();
  }

  public get(): Observable<string> {
    return this._http.get<IGetMissionResponse>(this.API_ROUTES.community.getMission()).pipe(
      map((response: IGetMissionResponse) => response.data),
      map((resp: string) => {
        return resp;
      })
    );
  }
}
