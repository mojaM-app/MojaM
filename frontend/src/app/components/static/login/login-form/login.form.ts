import { FormControl } from '@angular/forms';

export interface ILoginForm {
  email: FormControl<string | null>;
  phone: FormControl<string | null>;
  passcode: FormControl<string | null>;
}

export enum LoginFormSteps {
  EnterEmail,
  EnterPhone,
  AuthenticationTypeNotSet,
  EnterPassword,
  EnterPin,
  ResetPasscode,
  UserNotActive,
}
