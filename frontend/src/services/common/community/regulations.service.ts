import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { BaseService } from '../base.service';
import { IGetRegulationsResponse } from 'src/interfaces/community/regulations';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RegulationsService extends BaseService {
  public constructor(private _http: HttpClient) {
    super();
  }

  public get(): Observable<string> {
    return this._http.get<IGetRegulationsResponse>(this.API_ROUTES.community.getRegulations()).pipe(
      map((response: IGetRegulationsResponse) => response.data),
      map((resp: string) => {
        return resp;
      })
    );
  }
}
