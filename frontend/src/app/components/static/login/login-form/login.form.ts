import { FormControl } from '@angular/forms';

export interface ILoginForm {
  email: FormControl<string | null>;
  phone: FormControl<string | null>;
  password: FormControl<string | null>;
}

export const LoginFormControlNames: { [K in keyof ILoginForm]: string } = {
  email: 'email',
  phone: 'phone',
  password: 'password',
} as const;
