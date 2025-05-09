import { Injectable } from '@angular/core';
import { IAuthTokenPayload } from 'src/services/auth/interfaces/IAuthTokenPayload';
import { LocalStorageService } from 'src/services/storage/localstorage.service';
import { TokenService } from './base-token.service';

@Injectable({
  providedIn: 'root',
})
export class AuthTokenService extends TokenService<IAuthTokenPayload> {
  public constructor(_localStorageService: LocalStorageService) {
    super(_localStorageService);
  }

  public getUserName(): string | undefined {
    const payload = this.getPayload();

    if (!payload) {
      return undefined;
    }

    return payload.userName ?? undefined;
  }

  public getUserEmail(): string | undefined {
    const payload = this.getPayload();

    if (!payload) {
      return undefined;
    }

    return payload.email;
  }

  public getUserPhone(): string | undefined {
    const payload = this.getPayload();

    if (!payload) {
      return undefined;
    }

    return payload.phone;
  }

  public getUserPermissions(): number[] {
    const payload = this.getPayload();

    if (!payload || !payload.permissions || !payload.permissions.length) {
      return [];
    }

    return payload.permissions;
  }

  public override getUserId(): string | undefined {
    return super.getUserId();
  }

  public getUserInitialLetters(): string | undefined {
    const userName = this.getUserName();

    return (
      userName
        ?.split(' ')
        .map(n => (n?.length > 0 ? n[0].toLocaleUpperCase() : ''))
        .slice(0, 2)
        .join('') ?? undefined
    );
  }

  protected override getKeyName(): string {
    return 'token';
  }
}
