import { FormControl, FormGroup } from '@angular/forms';

export interface IIdentityFormGroup {
  email: FormControl<string | null>;
  emailConfirmed: FormControl<boolean>;
  phone: FormControl<string | null>;
  phoneConfirmed: FormControl<boolean>;
}

export interface IUserInfoFormGroup {
  firstName: FormControl<string | null>;
  lastName: FormControl<string | null>;
  joiningDate: FormControl<Date | null>;
}

export interface ISetPasswordFormGroup {
  password: FormControl<string | null>;
  confirmPassword: FormControl<string | null>;
}

export interface IActivateAccountForm {
  identity: FormGroup<IIdentityFormGroup>;
  userInfo: FormGroup<IUserInfoFormGroup>;
  setPassword: FormGroup<ISetPasswordFormGroup>;
}
