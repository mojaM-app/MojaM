import { AuthenticationTypes } from 'src/app/components/static/activate-account/enums/authentication-type.enum';
import { IGetAccountBeforeLogInResponseDto } from '../interfaces/IGetAccountBeforeLogInResponseDto';

export class AccountBeforeLogIn {
  private readonly _accountBeforeLogIn: IGetAccountBeforeLogInResponseDto;

  public constructor(accountBeforeLogIn: IGetAccountBeforeLogInResponseDto) {
    this._accountBeforeLogIn = accountBeforeLogIn;
  }

  public isPasswordSet(): boolean {
    return this._accountBeforeLogIn?.authType === AuthenticationTypes.Password;
  }

  public isPinSet(): boolean {
    return this._accountBeforeLogIn?.authType === AuthenticationTypes.Pin;
  }

  public isActive(): boolean {
    return this._accountBeforeLogIn?.isActive === true;
  }

  public isPhoneRequired(): boolean {
    return this._accountBeforeLogIn?.isPhoneRequired === true;
  }
}
