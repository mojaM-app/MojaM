import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BaseService } from 'src/services/common/base.service';
import { HttpClientService } from 'src/services/common/httpClient.service';
import { SpinnerService } from 'src/services/spinner/spinner.service';
import { IActivateAccountResult, IUserToActivate } from '../interfaces/activate-account';
import { ActivateUserDto } from '../models/user.model';

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

  public get(userUuid: string): Observable<IUserToActivate> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.auth.getUserToActivate(userUuid))
      .post<IUserToActivate>()
      .pipe(
        this._spinnerService.waitForSubscription(),
        map((resp: IUserToActivate) => {
          if (resp) {
            resp.joiningDate = resp.joiningDate ? new Date(resp.joiningDate) : null;
          }

          return resp;
        })
      );
  }

  public activate(userUuid: string, user: ActivateUserDto): Observable<IActivateAccountResult> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.auth.activateAccount(userUuid))
      .withBody({ ...user })
      .post<IActivateAccountResult>()
      .pipe(this._spinnerService.waitForSubscription());
  }
}
