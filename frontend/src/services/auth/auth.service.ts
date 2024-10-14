import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import {
  CheckResetPasswordTokenResult,
  ILoginModel,
  ILoginResponse,
  ResetPasswordResultDto,
  UserInfoBeforeLogInResult,
} from 'src/interfaces/auth/auth.models';
import { BaseService } from '../common/base.service';
import { HttpClientService } from '../common/httpClient.service';
import { LocalStorageService } from '../storage/localstorage.service';
import { AuthTokenService } from './auth-token.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService extends BaseService {
  public get isAuthenticated(): Observable<boolean> {
    return this._isLoggedIn$.asObservable();
  }

  private static _refreshTokenStorageKey = 'refresh_token';
  private _isLoggedIn$ = new BehaviorSubject<boolean>(false);

  public constructor(
    private _httpClient: HttpClientService,
    private _authTokenService: AuthTokenService,
    private _localStorageService: LocalStorageService
  ) {
    super();

    this._isLoggedIn$.next(this._authTokenService.isTokenValid());
  }

  public getUserInfoBeforeLogIn(
    email: string,
    phone?: string
  ): Observable<UserInfoBeforeLogInResult> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.auth.getUserInfoBeforeLogIn())
      .withBody({ email, phone })
      .post<UserInfoBeforeLogInResult>();
  }

  public sendEmailResetPassword(email: string, phone?: string): Observable<boolean> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.auth.requestResetPasswordPath())
      .withBody({ email, phone })
      .post<boolean>();
  }

  public login(
    email: string,
    phone: string | undefined,
    password: string
  ): Observable<ILoginResponse> {
    const model = {
      email: email,
      phone: phone,
      password: password,
    } satisfies ILoginModel;

    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.auth.login())
      .withBody(model)
      .post<ILoginResponse>()
      .pipe(
        tap((response: ILoginResponse) => {
          this._authTokenService.saveToken(response?.accessToken);
          this.saveRefreshToken(response?.refreshToken);
          this._isLoggedIn$.next(this._authTokenService.isTokenValid());
        })
      );
  }

  public logout(): void {
    this.removeRefreshToken();
    this._authTokenService.removeToken();
    this._isLoggedIn$.next(this._authTokenService.isTokenValid());
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
      .withUrl(this.API_ROUTES.auth.resetPasswordPath())
      .withBody({ userId, token, password })
      .post<ResetPasswordResultDto>();
  }

  public refreshAccessToken(): Observable<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!(refreshToken?.length ?? 0)) {
      return of(null);
    }

    const accessToken = this._authTokenService.getToken();

    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.auth.refreshToken())
      .withBody({ accessToken, refreshToken })
      .post<string | null>()
      .pipe(
        tap((newAccessToken: string | null) => {
          this._authTokenService.saveToken(newAccessToken);
          this._isLoggedIn$.next(this._authTokenService.isTokenValid());
        })
      );
  }

  private getRefreshToken(): string | null {
    return this._localStorageService.loadString(AuthService._refreshTokenStorageKey);
  }

  private saveRefreshToken(refreshToken: string | undefined): void {
    if ((refreshToken?.length ?? 0) > 0) {
      this._localStorageService.saveString(AuthService._refreshTokenStorageKey, refreshToken!);
    } else {
      this.removeRefreshToken();
    }
  }

  private removeRefreshToken(): void {
    this._localStorageService.removeItem(AuthService._refreshTokenStorageKey);
  }
}
