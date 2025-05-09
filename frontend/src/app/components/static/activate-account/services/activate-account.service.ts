import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BaseService } from 'src/services/common/base.service';
import { HttpClientService } from 'src/services/common/httpClient.service';
import { SpinnerService } from 'src/services/spinner/spinner.service';
import { IAccountToActivate, IActivateAccountResult } from '../interfaces/activate-account';
import { ActivateAccountDto } from '../models/activate-account.model';

@Injectable({
  providedIn: 'root',
})
export class ActivateAccountService extends BaseService {
  public constructor(
    private _httpClient: HttpClientService,
    private _spinnerService: SpinnerService
  ) {
    super();
  }

  public get(userUuid: string): Observable<IAccountToActivate> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.auth.getAccountToActivate(userUuid))
      .post<IAccountToActivate>()
      .pipe(
        this._spinnerService.waitForSubscription(),
        map((resp: IAccountToActivate) => {
          if (resp) {
            resp.joiningDate = this.toDateTime(resp.joiningDate);
          }

          return resp;
        })
      );
  }

  public activate(userUuid: string, user: ActivateAccountDto): Observable<IActivateAccountResult> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.auth.activateAccount(userUuid))
      .withBody({ ...user })
      .post<IActivateAccountResult>()
      .pipe(this._spinnerService.waitForSubscription());
  }
}
