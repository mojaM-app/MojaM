import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { IGetDiaconieResponse } from '../../../interfaces/community/diaconie';
import { BaseService } from '../base.service';
import { HttpClientService } from '../httpClient.service';

@Injectable({
  providedIn: 'root',
})
export class DiaconieService extends BaseService {
  public constructor(private _httpClient: HttpClientService) {
    super();
  }

  public get(): Observable<string> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.community.getDiaconie())
      .get<IGetDiaconieResponse>()
      .pipe(
        map((response: IGetDiaconieResponse) => response.data),
        map((resp: string) => {
          return resp;
        })
      );
  }
}
