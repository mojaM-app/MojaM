import { BehaviorSubject, Observable } from 'rxjs';
import { ITokenChangedEvent } from 'src/interfaces/auth/auth.events';
import { IAuthTokenPayload, ITokenPayload } from 'src/interfaces/auth/IAuthTokenPayload';
import { LocalStorageService } from 'src/services/storage/localstorage.service';

export abstract class TokenService<TPayload extends IAuthTokenPayload | ITokenPayload> {
  public get tokenChanged(): Observable<ITokenChangedEvent> {
    return this._tokenChanged$.asObservable();
  }

  protected readonly _tokenChanged$ = new BehaviorSubject<ITokenChangedEvent>({
    isValid: false,
  } satisfies ITokenChangedEvent);

  public constructor(private _localStorageService: LocalStorageService) {
    this._tokenChanged$.next(this.getTokenChangedEventData());
  }

  public getToken(): string | null {
    const token = this._localStorageService.loadString(this.getKeyName());

    if (!(token?.length ?? 0)) {
      return null;
    }

    return token;
  }

  public saveToken(token: string | null | undefined): void {
    if ((token?.length ?? 0) > 0) {
      this._localStorageService.saveString(this.getKeyName(), token!);

      this._tokenChanged$.next(this.getTokenChangedEventData());
    } else {
      this.removeToken();
    }
  }

  public removeToken(): void {
    this._localStorageService.removeItem(this.getKeyName());

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

  protected getPayload(): TPayload | null | undefined {
    const token = this.getToken();
    if (!token?.length) {
      return null;
    }

    return JSON.parse(atob(token.split('.')[1]));
  }

  protected abstract getKeyName(): string;

  private getExpirationTime(): Date | null {
    const payload = this.getPayload();

    if (!payload) {
      return null;
    }

    return payload.exp > 0 ? new Date(payload.exp * 1000) : null;
  }

  private getUserId(): string | undefined {
    const payload = this.getPayload();

    if (!payload) {
      return undefined;
    }

    return payload.sub;
  }

  private getTokenChangedEventData(): ITokenChangedEvent {
    return {
      isValid: this.isTokenValid(),
      userId: this.getUserId(),
    } satisfies ITokenChangedEvent;
  }
}
