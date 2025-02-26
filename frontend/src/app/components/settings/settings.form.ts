import { FormControl } from '@angular/forms';

export interface ISettingsForm {
  isDarkMode: FormControl<boolean>;
  fontSize: FormControl<number>;
}
