import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { IGetStructureResponse } from '../../../interfaces/community/structure';
import { BaseService } from '../base.service';

@Injectable({
  providedIn: 'root',
})
export class StructureService extends BaseService {
  public constructor(private _http: HttpClient) {
    super();
  }

  public get(): Observable<string> {
    return this._http.get<IGetStructureResponse>(this.API_ROUTES.community.getStructure()).pipe(
      map((response: IGetStructureResponse) => response.data),
      map((resp: string) => {
        return resp;
      })
    );
  }
}
