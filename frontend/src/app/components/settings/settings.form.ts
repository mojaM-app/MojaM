import { FormControl } from "@angular/forms";

export interface ISettingsForm {
  isDarkMode : FormControl<boolean>;
}

export const SettingsFormControlNames = {
  isDarkMode : 'isDarkMode',
} as const;
