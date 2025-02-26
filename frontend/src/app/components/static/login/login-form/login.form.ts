import { FormControl } from '@angular/forms';

export interface ILoginForm {
  email: FormControl<string | null>;
  phone: FormControl<string | null>;
  password: FormControl<string | null>;
}

export enum LoginFormSteps {
  EnterEmail,
  EnterPhone,
  ResetPassword,
  EnterPassword,
  ForgotPassword,
  UserNotActive,
}
