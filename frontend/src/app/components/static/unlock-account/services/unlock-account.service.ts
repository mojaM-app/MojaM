import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IUnlockAccountResult } from 'src/app/components/static/unlock-account/interfaces/unlock-account';
import { BaseService } from 'src/services/common/base.service';
import { HttpClientService } from 'src/services/common/httpClient.service';
import { SpinnerService } from 'src/services/spinner/spinner.service';

@Injectable({
  providedIn: 'root',
})
export class UnlockAccountService extends BaseService {
  public constructor(
    private _httpClient: HttpClientService,
    private _spinnerService: SpinnerService
  ) {
    super();
  }

  public unlock(userUuid: string): Observable<IUnlockAccountResult> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.auth.unlock(userUuid))
      .post<IUnlockAccountResult>()
      .pipe(this._spinnerService.waitForSubscription());
  }
}
