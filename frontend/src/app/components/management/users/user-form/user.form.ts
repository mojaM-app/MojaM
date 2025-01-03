import { FormControl } from '@angular/forms';

export interface IUserForm {
  email: FormControl<string | null>;
  phone: FormControl<string | null>;
  firstName: FormControl<string | null>;
  lastName: FormControl<string | null>;
  joiningDate: FormControl<Date | null>;
}

export const UserFormControlNames: { [K in keyof IUserForm]: string } = {
  email: 'email',
  phone: 'phone',
  firstName: 'firstName',
  lastName: 'lastName',
  joiningDate: 'joiningDate',
} as const;

export const EmailMaxLength = 255;
export const PhoneMaxLength = 30;
export const NameMaxLength = 255;
