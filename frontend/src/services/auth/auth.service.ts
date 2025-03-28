import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, skip, tap } from 'rxjs';
import {
  IAccountBeforeLogInDto,
  ILoginModel,
  ILoginResponse,
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
    return this._isAuthenticated$.asObservable();
  }
  public readonly onAuthStateChanged: Observable<boolean>;

  private _isAuthenticated$ = new BehaviorSubject<boolean>(false);

  public constructor(
    private _httpClient: HttpClientService,
    private _authTokenService: AuthTokenService,
    private _refreshTokenService: RefreshTokenService
  ) {
    super();

    this._isAuthenticated$.next(this.isSessionValid());

    this.onAuthStateChanged = this._isAuthenticated$.asObservable().pipe(skip(1));
  }

  public getAccountBeforeLogIn(email: string, phone?: string): Observable<IAccountBeforeLogInDto> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.auth.getAccountBeforeLogIn())
      .withBody({ email, phone })
      .post<IAccountBeforeLogInDto>();
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
          this._isAuthenticated$.next(this._authTokenService.isTokenValid());
        })
      );
  }

  public logout(): void {
    this._refreshTokenService.removeToken();
    this._authTokenService.removeToken();
    this._isAuthenticated$.next(this._authTokenService.isTokenValid());
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
          this._isAuthenticated$.next(this._authTokenService.isTokenValid());
        })
      );
  }

  public isSessionValid(): boolean {
    const isAccessTokenValid = this._authTokenService.isTokenValid();
    if (isAccessTokenValid) {
      return true;
    }

    return this._refreshTokenService.isTokenValid();
  }
}
