import { Injectable } from '@angular/core';
import { ITokenPayload } from 'src/services/auth/interfaces/IAuthTokenPayload';
import { LocalStorageService } from '../storage/localstorage.service';
import { TokenService } from './base-token.service';

@Injectable({
  providedIn: 'root',
})
export class RefreshTokenService extends TokenService<ITokenPayload> {
  public constructor(localStorageService: LocalStorageService) {
    super(localStorageService);
  }

  protected override getKeyName(): string {
    return 'refresh_token';
  }
}
