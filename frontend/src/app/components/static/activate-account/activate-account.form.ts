import { FormControl, FormGroup } from '@angular/forms';

export interface IIdentityFormGroup {
  email: FormControl<string | null>;
  emailConfirmed: FormControl<boolean>;
  phone: FormControl<string | null>;
  phoneConfirmed: FormControl<boolean>;
}

export const IdentityFormGroupControlNames: {
  [K in keyof IIdentityFormGroup]: string;
} = {
  email: 'email',
  emailConfirmed: 'emailConfirmed',
  phone: 'phone',
  phoneConfirmed: 'phoneConfirmed',
} as const;

export interface IUserInfoFormGroup {
  firstName: FormControl<string | null>;
  lastName: FormControl<string | null>;
  joiningDate: FormControl<Date | null>;
}

export const UserInfoFormGroupControlNames: {
  [K in keyof IUserInfoFormGroup]: string;
} = {
  firstName: 'firstName',
  lastName: 'lastName',
  joiningDate: 'joiningDate',
} as const;

export interface ISetPasswordFormGroup {
  password: FormControl<string | null>;
  confirmPassword: FormControl<string | null>;
}

export const SetPasswordFormGroupControlNames: {
  [K in keyof ISetPasswordFormGroup]: string;
} = {
  password: 'password',
  confirmPassword: 'confirmPassword',
} as const;

export interface IActivateAccountForm {
  identity: FormGroup<IIdentityFormGroup>;
  userInfo: FormGroup<IUserInfoFormGroup>;
  setPassword: FormGroup<ISetPasswordFormGroup>;
}

export const ActivateAccountFormGroupNames: { [K in keyof IActivateAccountForm]: string } = {
  identity: 'identity',
  userInfo: 'userInfo',
  setPassword: 'setPassword',
} as const;
