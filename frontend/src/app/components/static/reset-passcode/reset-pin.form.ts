import { FormControl } from '@angular/forms';

export interface IResetPinForm {
  pin: FormControl<string | null>;
  confirmPin: FormControl<string | null>;
}
