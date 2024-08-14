import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { IGetStructureResponse } from '../../../interfaces/community/structure';
import { BaseService } from '../base.service';
import { HttpClientService } from '../httpClient.service';

@Injectable({
  providedIn: 'root',
})
export class StructureService extends BaseService {
  public constructor(private _httpClient: HttpClientService) {
    super();
  }

  public get(): Observable<string> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.community.getStructure())
      .get<IGetStructureResponse>()
      .pipe(
        map((response: IGetStructureResponse) => response.data),
        map((resp: string) => {
          return resp;
        })
      );
  }
}
