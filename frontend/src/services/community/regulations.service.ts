import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { BaseService } from '../common/base.service';
import { HttpClientService } from '../common/httpClient.service';

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
      .get<string>();
  }
}