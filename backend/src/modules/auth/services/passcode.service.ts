import { isNullOrEmptyString } from '@utils';
import Container, { Service } from 'typedi';
import { AuthenticationTypes } from '../enums/authentication-type.enum';
import { getAuthenticationType } from '../helpers/auth.helper';
import { PasswordService } from './password.service';
import { PinService } from './pin.service';

@Service()
export class PasscodeService {
  private readonly _passwordService: PasswordService;
  private readonly _pinService: PinService;

  public constructor() {
    this._passwordService = Container.get(PasswordService);
    this._pinService = Container.get(PinService);
  }

  public isValid(passcode: string | null | undefined): boolean {
    if (isNullOrEmptyString(passcode)) {
      return false;
    }

    return this.isPassword(passcode) || this.isPin(passcode);
  }

  public match(user: { salt: string; passcode: string | null }, passcode: string | null | undefined): boolean {
    if (isNullOrEmptyString(passcode) || isNullOrEmptyString(user.passcode)) {
      return false;
    }

    const authType = getAuthenticationType(user);
    switch (authType) {
      case AuthenticationTypes.Password:
        return this._passwordService.match(passcode!, user.salt, user.passcode!);
      case AuthenticationTypes.Pin:
        return this._pinService.match(passcode!, user.salt, user.passcode!);
      default:
        return false;
    }
  }

  public getHash(salt: string, passcode: string | null | undefined): string | null {
    if (isNullOrEmptyString(passcode)) {
      return null;
    }

    if (this.isPassword(passcode)) {
      return this._passwordService.getHash(salt, passcode!);
    }

    if (this.isPin(passcode)) {
      return this._pinService.getHash(salt, passcode!);
    }

    return null;
  }

  private isPassword(passcode: string | undefined | null): boolean {
    return this._passwordService.isValid(passcode);
  }

  private isPin(passcode: string | undefined | null): boolean {
    return this._pinService.isValid(passcode);
  }
}
