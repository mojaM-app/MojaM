import { FormControl, FormGroup } from '@angular/forms';
import { IResetPasswordForm } from '../reset-password/reset-password.form';
import { IResetPinForm } from '../reset-password/reset-pin.form';
import { AuthenticationTypes } from './enums/authentication-type.enum';

export interface IContactFormGroup {
  email: FormControl<string | null>;
  emailConfirmed: FormControl<boolean>;
  phone: FormControl<string | null>;
  phoneConfirmed: FormControl<boolean>;
}

export interface IPersonalInfoFormGroup {
  firstName: FormControl<string | null>;
  lastName: FormControl<string | null>;
  joiningDate: FormControl<Date | null>;
}

export interface IAuthenticationFormGroup extends IResetPasswordForm, IResetPinForm {
  authenticationType: FormControl<AuthenticationTypes | null>;
}

export interface IActivateAccountForm {
  contact: FormGroup<IContactFormGroup>;
  personalInfo: FormGroup<IPersonalInfoFormGroup>;
  authentication: FormGroup<IAuthenticationFormGroup>;
}
