import { FormControl } from '@angular/forms';

export interface IResetPasswordForm {
  password: FormControl<string | null>;
  confirmPassword: FormControl<string | null>;
}

export const ResetPasswordFormControlNames: { [K in keyof IResetPasswordForm]: string } = {
  password: 'password',
  confirmPassword: 'confirmPassword',
} as const;
