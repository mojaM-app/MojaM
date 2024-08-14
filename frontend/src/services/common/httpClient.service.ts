import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, EMPTY, Observable, retry, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HttpClientService {
  public constructor(private _http: HttpClient) {}

  public request(): RequestBuilder {
    return new RequestBuilder(this._http).withJsonContentType();
  }
}

export class RequestBuilder {
  private _url: string | undefined;
  private _body: any | undefined;
  private readonly _headers: HttpHeaders;

  public constructor(private _http: HttpClient) {
    this._headers = new HttpHeaders();
  }

  public get<TResponse>(): Observable<TResponse> {
    if ((this._url?.length ?? 0) === 0) {
      return EMPTY;
    }

    return this._http
      .get<TResponse>(this._url ?? '', { headers: this._headers })
      .pipe(retry(1), catchError(this.handleError));
  }

  public withUrl(url: string): RequestBuilder {
    this._url = url;
    return this;
  }

  public withJsonContentType(): RequestBuilder {
    this._headers.set('Content-Type', 'application/json');
    return this;
  }

  // public withBody(body: any): RequestBuilder {
  //   this._body = body;
  //   return this;
  // }

  // public withHeaders(headers: HttpHeaders): RequestBuilder {
  //   this._headers = headers;
  //   return this;
  // }

  // Error handling
  private handleError(error: any): Observable<never> {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // Get client-side error
      errorMessage = error.error.message;
    } else {
      // Get server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    return throwError(() => {
      return errorMessage;
    });
  }
}
