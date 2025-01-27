import { FormControl } from '@angular/forms';

export interface ISettingsForm {
  isDarkMode: FormControl<boolean>;
  fontSize: FormControl<number>;
}

export const SettingsFormControlNames: { [K in keyof ISettingsForm]: string } = {
  isDarkMode: 'isDarkMode',
  fontSize: 'fontSize',
} as const;
