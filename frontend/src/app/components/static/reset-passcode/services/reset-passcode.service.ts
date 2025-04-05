import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IResetPasscodeResultDto } from 'src/services/auth/interfaces/IResetPasscodeResultDto';
import { BaseService } from 'src/services/common/base.service';
import { HttpClientService } from 'src/services/common/httpClient.service';
import { SpinnerService } from 'src/services/spinner/spinner.service';
import { ICheckResetPasscodeTokenResultDto } from '../interfaces/reset-passcode.interfaces';
import { RequestResetPasscodeDto, ResetPasscodeDto } from '../models/reset-passcode.models';

@Injectable({
  providedIn: 'root',
})
export class ResetPasscodeService extends BaseService {
  public constructor(
    private _httpClient: HttpClientService,
    private _spinnerService: SpinnerService
  ) {
    super();
  }

  public requestResetPasscode(model: RequestResetPasscodeDto): Observable<boolean> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.auth.requestResetPasscode())
      .withBody({ ...model })
      .post<boolean>()
      .pipe(this._spinnerService.waitForSubscription());
  }

  public checkResetPasscodeToken(
    userUuid: string,
    token: string
  ): Observable<ICheckResetPasscodeTokenResultDto> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.auth.checkResetPasscodeToken(userUuid, token))
      .post<ICheckResetPasscodeTokenResultDto>();
  }

  public resetPasscode(
    userUuid: string,
    model: ResetPasscodeDto
  ): Observable<IResetPasscodeResultDto> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.auth.resetPasscode(userUuid))
      .withBody({ ...model })
      .post<IResetPasscodeResultDto>();
  }
}
