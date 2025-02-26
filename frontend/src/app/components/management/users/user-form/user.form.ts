import { FormControl } from '@angular/forms';

export interface IUserForm {
  email: FormControl<string | null>;
  phone: FormControl<string | null>;
  firstName: FormControl<string | null>;
  lastName: FormControl<string | null>;
  joiningDate: FormControl<Date | null>;
}
