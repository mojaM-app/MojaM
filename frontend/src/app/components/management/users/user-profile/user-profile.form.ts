import { FormControl } from '@angular/forms';

export interface IUserProfileForm {
  email: FormControl<string | null>;
  phone: FormControl<string | null>;
  firstName: FormControl<string | null>;
  lastName: FormControl<string | null>;
  joiningDate: FormControl<Date | null>;
}

export const UserProfileFormControlNames: { [K in keyof IUserProfileForm]: string } = {
  email: 'email',
  phone: 'phone',
  firstName: 'firstName',
  lastName: 'lastName',
  joiningDate: 'joiningDate',
} as const;
