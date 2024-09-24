import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ITokenChangedEvent } from 'src/interfaces/auth/auth.events';
import { LocalStorageService } from 'src/services/storage/localstorage.service';

interface IAuthTokenPayload {
  exp: number;
  sub: string;
  userName?: string;
  permissions?: number[];
}

@Injectable({
  providedIn: 'root',
})
export class AuthTokenService {
  private static _tokenStorageKey = 'token';

  public get tokenChanged(): Observable<ITokenChangedEvent> {
    return this._tokenChanged$.asObservable();
  }

  private readonly _tokenChanged$ = new BehaviorSubject<ITokenChangedEvent>({
    isValid: false,
  } satisfies ITokenChangedEvent);

  public constructor(private _localStorageService: LocalStorageService) {
    this._tokenChanged$.next(this.getTokenChangedEventData());
  }

  public getToken(): string | null {
    const token = this._localStorageService.loadString(AuthTokenService._tokenStorageKey);

    if (!(token?.length ?? 0)) {
      return null;
    }

    return token;
  }

  public saveToken(token: string | null | undefined): void {
    if ((token?.length ?? 0) > 0) {
      this._localStorageService.saveString(AuthTokenService._tokenStorageKey, token!);

      this._tokenChanged$.next(this.getTokenChangedEventData());
    } else {
      this.removeToken();
    }
  }

  public removeToken(): void {
    this._localStorageService.removeItem(AuthTokenService._tokenStorageKey);

    this._tokenChanged$.next(this.getTokenChangedEventData());
  }

  public isTokenValid(): boolean {
    const expirationTime = this.getExpirationTime();
    if (expirationTime == null) {
      return false;
    }

    const currentTime = new Date();
    return currentTime < expirationTime;
  }

  public getUserName(): string | undefined {
    const payload = this.getPayload();

    if (!payload) {
      return undefined;
    }

    return payload.userName;
  }

  public getUserPermissions(): number[] {
    const payload = this.getPayload();

    if (!payload || !payload.permissions || !payload.permissions.length) {
      return [];
    }

    return payload.permissions;
  }

  public getUserInitialLetters(): string | undefined {
    const payload = this.getPayload();

    if (!payload) {
      return undefined;
    }

    return (
      payload.userName
        ?.split(' ')
        .map(n => (n?.length > 0 ? n[0].toLocaleUpperCase() : ''))
        .slice(0, 2)
        .join('') ?? undefined
    );
  }

  public getUserId(): string | undefined {
    const payload = this.getPayload();

    if (!payload) {
      return undefined;
    }

    return payload.sub;
  }

  private getExpirationTime(): Date | null {
    const payload = this.getPayload();

    if (!payload) {
      return null;
    }

    return payload.exp > 0 ? new Date(payload.exp * 1000) : null;
  }

  private getPayload(): IAuthTokenPayload | null | undefined {
    const token = this.getToken();
    if (!token?.length) {
      return null;
    }

    return JSON.parse(atob(token.split('.')[1])) as IAuthTokenPayload;
  }

  private getTokenChangedEventData(): ITokenChangedEvent {
    return {
      isValid: this.isTokenValid(),
      userId: this.getUserId(),
    } satisfies ITokenChangedEvent;
  }
}
