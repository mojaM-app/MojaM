/* eslint-disable @typescript-eslint/member-ordering */
import { computed, Injectable, Signal, signal } from '@angular/core';
import { map, Observable, of, tap } from 'rxjs';
import { ILoginResponseDto } from 'src/services/auth/interfaces/ILoginResponseDto';
import { BaseService } from '../common/base.service';
import { HttpClientService } from '../common/httpClient.service';
import { AuthTokenService } from './auth-token.service';
import { IGetAccountBeforeLogInResponseDto } from './interfaces/IGetAccountBeforeLogInResponseDto';
import { ILoginModelDto } from './interfaces/ILoginModelDto';
import { AccountBeforeLogIn } from './models/account-before-logIn';
import { RefreshTokenService } from './refresh-token.service';

export class AuthState {
  public constructor(private readonly _isAuthenticated: Signal<boolean>) {}

  public whenUnauthenticated(cb: () => void): void {
    if (!this._isAuthenticated()) {
      cb();
    }
  }

  public whenAuthenticated(cb: () => void): void {
    if (this._isAuthenticated()) {
      cb();
    }
  }
}

@Injectable({
  providedIn: 'root',
})
export class AuthService extends BaseService {
  private readonly _isAuthenticated = signal<boolean>(false);
  public readonly isAuthenticated = this._isAuthenticated.asReadonly();

  public readonly onAuthStateChanged = new AuthState(computed(() => this._isAuthenticated()));

  public constructor(
    private _httpClient: HttpClientService,
    private _authTokenService: AuthTokenService,
    private _refreshTokenService: RefreshTokenService
  ) {
    super();

    this._isAuthenticated.set(this.isSessionValid());
  }

  public getAccountBeforeLogIn(email: string, phone?: string): Observable<AccountBeforeLogIn> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.auth.getAccountBeforeLogIn())
      .withBody({ email, phone })
      .post<IGetAccountBeforeLogInResponseDto>()
      .pipe(
        map((response: IGetAccountBeforeLogInResponseDto) => {
          return new AccountBeforeLogIn(response);
        })
      );
  }

  public login(
    email: string,
    phone: string | undefined,
    passcode: string
  ): Observable<ILoginResponseDto> {
    const model = {
      email: email,
      phone: phone,
      passcode: passcode,
    } satisfies ILoginModelDto;

    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.auth.login())
      .withBody(model)
      .post<ILoginResponseDto>()
      .pipe(
        tap((response: ILoginResponseDto) => {
          this._authTokenService.saveToken(response?.accessToken);
          this._refreshTokenService.saveToken(response?.refreshToken);
          this._isAuthenticated.set(this._authTokenService.isTokenValid());
        })
      );
  }

  public logout(): void {
    this._refreshTokenService.removeToken();
    this._authTokenService.removeToken();
    this._isAuthenticated.set(this._authTokenService.isTokenValid());
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
          this._isAuthenticated.set(this._authTokenService.isTokenValid());
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
