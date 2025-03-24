import { errorKeys } from '@exceptions';
import Container from 'typedi';
import { AuthenticationTypes } from '../enums/authentication-type.enum';
import { getAuthenticationType } from '../helpers/auth.helper';
import { PasswordService } from './password.service';
import { PinService } from './pin.service';

export interface IAuthenticationTypeService {
  getHash: (salt: string, text: string) => string;
  match: (text: string, salt: string, hashedText: string) => boolean;
  isValid: (text: string | undefined | null) => boolean;
}

class AuthenticationTypFactory {
  public static create(authenticationType: AuthenticationTypes | undefined): IAuthenticationTypeService {
    switch (authenticationType) {
      case AuthenticationTypes.Password:
        return Container.get(PasswordService);
      case AuthenticationTypes.Pin:
        return Container.get(PinService);
      default:
        throw new Error(errorKeys.login.Invalid_Authentication_Type);
    }
  }
}

export class AuthenticationTypService {
  private readonly _authenticationTypeService: IAuthenticationTypeService;
  private readonly _authenticationType;

  private constructor(private readonly _authenticationData: { password?: string | null; pin?: string | null; salt?: string }) {
    this._authenticationType = getAuthenticationType(_authenticationData);
    this._authenticationTypeService = AuthenticationTypFactory.create(this._authenticationType);
  }

  public match(text: string): boolean {
    const hashedText = this.getPasscode();

    return this._authenticationTypeService.match(text, this._authenticationData.salt!, hashedText);
  }

  private getPasscode(): string {
    switch (this._authenticationType) {
      case AuthenticationTypes.Password:
        return this._authenticationData.password!;
      case AuthenticationTypes.Pin:
        return this._authenticationData.pin!;
      default:
        throw new Error(errorKeys.login.Invalid_Authentication_Type);
    }
  }

  public static create(authenticationData: { password?: string | null; pin?: string | null; salt: string }): AuthenticationTypService {
    return new AuthenticationTypService(authenticationData);
  }
}
