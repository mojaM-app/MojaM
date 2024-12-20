import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, EMPTY, map, Observable, retry, throwError } from 'rxjs';
import { IResponseError } from 'src/interfaces/errors/response.error';
import { TranslationService } from '../translate/translation.service';

@Injectable({
  providedIn: 'root',
})
export class HttpClientService {
  public constructor(
    private _http: HttpClient,
    private _translationService: TranslationService
  ) {}

  public request(): RequestBuilder {
    return new RequestBuilder(this._http, this._translationService).withJsonContentType();
  }
}

export class RequestBuilder {
  private _url: string | undefined;
  private _body: Record<string, unknown> | undefined;
  private _params = new HttpParams();
  private readonly _headers: HttpHeaders;

  public constructor(
    private _http: HttpClient,
    private _translationService: TranslationService
  ) {
    this._headers = new HttpHeaders();
  }

  public get<TResponse>(): Observable<TResponse> {
    if ((this._url?.length ?? 0) === 0) {
      return EMPTY;
    }

    return this._http
      .get<{
        message: string;
        data: TResponse;
      }>(this._url!, { headers: this._headers, params: this._params })
      .pipe(
        retry(1),
        map(response => response.data),
        catchError((error: unknown) => {
          return this.handleError(error);
        })
      );
  }

  public post<TResponse>(): Observable<TResponse> {
    if ((this._url?.length ?? 0) === 0) {
      return EMPTY;
    }

    return this._http
      .post<{ message: string; data: TResponse }>(this._url!, this._body, {
        headers: this._headers,
      })
      .pipe(
        map(response => response.data),
        catchError((error: unknown) => this.handleError(error))
      );
  }

  public put<TResponse>(): Observable<TResponse> {
    if ((this._url?.length ?? 0) === 0) {
      return EMPTY;
    }

    return this._http
      .put<{ message: string; data: TResponse }>(this._url!, this._body, {
        headers: this._headers,
      })
      .pipe(
        map(response => response.data),
        catchError((error: unknown) => this.handleError(error))
      );
  }

  public delete<TResponse>(): Observable<TResponse> {
    if ((this._url?.length ?? 0) === 0) {
      return EMPTY;
    }

    return this._http
      .delete<{ message: string; data: TResponse }>(this._url!, { headers: this._headers })
      .pipe(
        map(response => response.data),
        catchError((error: unknown) => this.handleError(error))
      );
  }

  public withUrl(url: string): RequestBuilder {
    this._url = url;
    return this;
  }

  public withJsonContentType(): RequestBuilder {
    this._headers.set('Content-Type', 'application/json');
    return this;
  }

  public withBody(body: Record<string, unknown>): RequestBuilder {
    this._body = body;
    return this;
  }

  public withParams(params: Record<string, unknown>): RequestBuilder {
    for (const key in params) {
      if (Object.prototype.hasOwnProperty.call(params, key)) {
        const value = params[key];
        if (value === null || value === undefined) {
          continue;
        }
        this._params = this._params.set(key, value.toString());
      }
    }
    return this;
  }

  // public withHeaders(headers: HttpHeaders): RequestBuilder {
  //   this._headers = headers;
  //   return this;
  // }

  private handleError(error: any): Observable<never> {
    if (error && 'error' in error && 'data' in error.error) {
      const data = error.error.data;
      if ('message' in data) {
        data.errorMessage = this._translationService.getError(data.message, data?.args ?? []);
      }
      return throwError(() => {
        return {
          ...data,
          status: error.status,
          httpMessage: error?.message,
        } satisfies IResponseError;
      });
    }

    if (error instanceof HttpErrorResponse) {
      return throwError(() => {
        return error;
      });
    }

    if (error?.error instanceof ErrorEvent) {
      return throwError(() => {
        return { ...error.error, status: error.status };
      });
    }

    return throwError(() => {
      return error;
    });
  }
}
