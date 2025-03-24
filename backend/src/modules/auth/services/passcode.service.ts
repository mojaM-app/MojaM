import Container, { Service } from 'typedi';
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

  public isValid(passcode: string | undefined | null): boolean {
    return this.isPassword(passcode) || this.isPin(passcode);
  }

  public isPassword(passcode: string | undefined | null): boolean {
    return this._passwordService.isValid(passcode);
  }

  public isPin(passcode: string | undefined | null): boolean {
    return this._pinService.isValid(passcode);
  }
}
