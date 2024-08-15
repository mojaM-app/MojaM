import { FormControl } from '@angular/forms';

export interface ISettingsForm {
  isDarkMode: FormControl<boolean>;
}

export const SettingsFormControlNames: { [K in keyof ISettingsForm]: string } = {
  isDarkMode: 'isDarkMode',
} as const;
