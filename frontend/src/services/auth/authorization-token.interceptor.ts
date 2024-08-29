import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, filter, Observable, switchMap, take, throwError } from 'rxjs';
import { AuthTokenService } from './auth-token.service';
import { AuthService } from './auth.service';

@Injectable()
export class AuthorizationHeaderInterceptor implements HttpInterceptor {
  private _isRefreshing = false;
  private _refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(
    null
  );

  public constructor(
    private _authService: AuthService,
    private _authTokenService: AuthTokenService
  ) {}

  public intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    request = this.addTokenToHeader(request, this._authTokenService.getToken());

    return next.handle(request).pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(request, next);
        }

        return throwError(() => error);
      })
    );
  }

  private handle401Error(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    if (this._isRefreshing) {
      return this._refreshTokenSubject.pipe(
        filter((token: string | null) => token != null),
        take(1),
        switchMap(token => {
          return next.handle(this.addTokenToHeader(request, token));
        })
      );
    }

    this._isRefreshing = true;
    this._refreshTokenSubject.next(null);

    return this._authService.refreshAccessToken().pipe(
      switchMap(() => {
        this._isRefreshing = false;
        const token = this._authTokenService.getToken();
        this._refreshTokenSubject.next(token);
        return next.handle(this.addTokenToHeader(request, token));
      }),
      catchError((error: unknown) => {
        this._isRefreshing = false;
        return throwError(() => error);
      })
    );
  }

  private addTokenToHeader(
    request: HttpRequest<unknown>,
    token: string | null | undefined
  ): HttpRequest<unknown> {
    if (!(token?.length ?? 0)) {
      return request;
    }

    return request.clone({
      headers: request.headers.set('Authorization', `Bearer ${token}`),
    });
  }
}
