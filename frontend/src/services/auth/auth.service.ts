import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import {
  ILoginModel,
  ILoginResponse,
  UserInfoBeforeLogInResult,
} from 'src/interfaces/auth/auth.models';
import { BaseService } from '../common/base.service';
import { HttpClientService } from '../common/httpClient.service';
import { AuthTokenService } from './auth-token.service';
import { RefreshTokenService } from './refresh-token.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService extends BaseService {
  public get isAuthenticated(): Observable<boolean> {
    return this._isLoggedIn$.asObservable();
  }

  private _isLoggedIn$ = new BehaviorSubject<boolean>(false);

  public constructor(
    private _httpClient: HttpClientService,
    private _authTokenService: AuthTokenService,
    private _refreshTokenService: RefreshTokenService
  ) {
    super();

    this._isLoggedIn$.next(this.isUserAuthenticated());
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
          this._refreshTokenService.saveToken(response?.refreshToken);
          this._isLoggedIn$.next(this._authTokenService.isTokenValid());
        })
      );
  }

  public logout(): void {
    this._refreshTokenService.removeToken();
    this._authTokenService.removeToken();
    this._isLoggedIn$.next(this._authTokenService.isTokenValid());
  }

  public refreshAccessToken(): Observable<string | null> {
    const refreshToken = this._refreshTokenService.getToken();
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

  private isUserAuthenticated(): boolean {
    const isAccessTokenValid = this._authTokenService.isTokenValid();
    if (isAccessTokenValid) {
      return true;
    }

    return this._refreshTokenService.isTokenValid();
  }
}
