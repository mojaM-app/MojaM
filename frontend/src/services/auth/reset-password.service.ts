import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CheckResetPasswordTokenResult,
  ResetPasswordResultDto,
} from 'src/interfaces/auth/auth.models';
import { BaseService } from '../common/base.service';
import { HttpClientService } from '../common/httpClient.service';

@Injectable({
  providedIn: 'root',
})
export class ResetPasswordService extends BaseService {
  public constructor(private _httpClient: HttpClientService) {
    super();
  }

  public sendEmailResetPassword(email: string, phone?: string): Observable<boolean> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.auth.requestResetPassword())
      .withBody({ email, phone })
      .post<boolean>();
  }

  public checkResetPasswordToken(
    userId: string,
    token: string
  ): Observable<CheckResetPasswordTokenResult> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.auth.checkResetPasswordToken(userId, token))
      .post<CheckResetPasswordTokenResult>();
  }

  public resetPassword(
    userId: string,
    token: string,
    password: string
  ): Observable<ResetPasswordResultDto> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.auth.resetPassword())
      .withBody({ userId, token, password })
      .post<ResetPasswordResultDto>();
  }
}
