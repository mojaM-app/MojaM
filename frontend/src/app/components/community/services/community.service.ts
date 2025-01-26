import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { BaseService } from 'src/services/common/base.service';
import { HttpClientService } from 'src/services/common/httpClient.service';
import { SpinnerService } from 'src/services/spinner/spinner.service';
import { ICommunity } from '../interfaces/community.interfaces';

@Injectable({
  providedIn: 'root',
})
export class CommunityService extends BaseService {
  public constructor(
    private _httpClient: HttpClientService,
    private _spinnerService: SpinnerService
  ) {
    super();
  }

  public get(): Observable<ICommunity> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.community.get())
      .get<ICommunity>()
      .pipe(this._spinnerService.waitForSubscription());
  }
}
