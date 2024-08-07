import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { IGetDiaconieResponse } from '../../../interfaces/community/diaconie';
import { BaseService } from '../base.service';

@Injectable({
  providedIn: 'root',
})
export class DiaconieService extends BaseService {
  public constructor(private _http: HttpClient) {
    super();
  }

  public get(): Observable<string> {
    return this._http.get<IGetDiaconieResponse>(this.API_ROUTES.community.getDiaconie()).pipe(
      map((response: IGetDiaconieResponse) => response.data),
      map((resp: string) => {
        return resp;
      })
    );
  }
}
