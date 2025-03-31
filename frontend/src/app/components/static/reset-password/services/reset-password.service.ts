import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IResetPasswordResultDto } from 'src/services/auth/interfaces/IResetPasswordResultDto';
import { BaseService } from 'src/services/common/base.service';
import { HttpClientService } from 'src/services/common/httpClient.service';
import { SpinnerService } from 'src/services/spinner/spinner.service';
import { ICheckResetPasswordTokenResultDto } from '../interfaces/reset-password.interfaces';
import { RequestResetPasswordDto, ResetPasswordDto } from '../models/reset-password.models';

@Injectable({
  providedIn: 'root',
})
export class ResetPasswordService extends BaseService {
  public constructor(
    private _httpClient: HttpClientService,
    private _spinnerService: SpinnerService
  ) {
    super();
  }

  public requestResetPassword(model: RequestResetPasswordDto): Observable<boolean> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.auth.requestResetPassword())
      .withBody({ ...model })
      .post<boolean>()
      .pipe(this._spinnerService.waitForSubscription());
  }

  public checkResetPasswordToken(
    userUuid: string,
    token: string
  ): Observable<ICheckResetPasswordTokenResultDto> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.auth.checkResetPasswordToken(userUuid, token))
      .post<ICheckResetPasswordTokenResultDto>();
  }

  public resetPassword(
    userUuid: string,
    model: ResetPasswordDto
  ): Observable<IResetPasswordResultDto> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.auth.resetPassword(userUuid))
      .withBody({ ...model })
      .post<IResetPasswordResultDto>();
  }
}
