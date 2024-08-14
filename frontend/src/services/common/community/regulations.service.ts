import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { IGetRegulationsResponse } from '../../../interfaces/community/regulations';
import { BaseService } from '../base.service';
import { HttpClientService } from '../httpClient.service';

@Injectable({
  providedIn: 'root',
})
export class RegulationsService extends BaseService {
  public constructor(private _httpClient: HttpClientService) {
    super();
  }

  public get(): Observable<string> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.community.getRegulations())
      .get<IGetRegulationsResponse>()
      .pipe(
        map((response: IGetRegulationsResponse) => response.data),
        map((resp: string) => {
          return resp;
        })
      );
  }
}
