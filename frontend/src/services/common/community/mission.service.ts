import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { BaseService } from '../base.service';
import { IGetMissionResponse } from 'src/interfaces/community/mission';
import { map } from 'rxjs';

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
