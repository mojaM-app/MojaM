import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { BaseService } from 'src/services/common/base.service';
import { HttpClientService } from 'src/services/common/httpClient.service';
import { SpinnerService } from 'src/services/spinner/spinner.service';
import { ICommunity } from '../interfaces/community.interfaces';
import { map } from 'rxjs';
import { UrlUtils } from 'src/utils/url.utils';

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
      .pipe(
        map((response: ICommunity) => {
          return {
            ...(response ?? {}),
            info: {
              ...(response?.info ?? {}),
              getMapsAddress: () => UrlUtils.getMapsAddress(response?.info?.address),
            },
          };
        }),
        this._spinnerService.waitForSubscription()
      );
  }
}
