import { FormControl } from '@angular/forms';

export interface IResetPasswordForm {
  password: FormControl<string | null>;
  confirmPassword: FormControl<string | null>;
}
