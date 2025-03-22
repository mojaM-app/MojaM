import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { VALIDATOR_SETTINGS } from 'src/core/consts';

export interface IStrongPasswordOptions {
  minLength: number;
  minLowercase: number;
  minUppercase: number;
  minNumbers: number;
  minSymbols: number;
}

export class PasswordValidator {
  public static strong(
    options: IStrongPasswordOptions = {
      minLength: VALIDATOR_SETTINGS.STRONG_PASSWORD_OPTIONS.minLength,
      minLowercase: VALIDATOR_SETTINGS.STRONG_PASSWORD_OPTIONS.minLowercase,
      minUppercase: VALIDATOR_SETTINGS.STRONG_PASSWORD_OPTIONS.minUppercase,
      minNumbers: VALIDATOR_SETTINGS.STRONG_PASSWORD_OPTIONS.minNumbers,
      minSymbols: VALIDATOR_SETTINGS.STRONG_PASSWORD_OPTIONS.minSymbols,
    }
  ): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control?.value;
      if (!value || typeof value !== 'string' || value.length < options.minLength) {
        return { invalidPassword: true };
      }

      const numberOfLowercase = (value.match(/[a-z]/g) || []).length;
      const numberOfUppercase = (value.match(/[A-Z]/g) || []).length;
      const numberOfNumbers = (value.match(/\d/g) || []).length;
      const numberOfSymbols =
        value.length - numberOfLowercase - numberOfUppercase - numberOfNumbers;

      if (
        numberOfLowercase < options.minLowercase ||
        numberOfUppercase < options.minUppercase ||
        numberOfNumbers < options.minNumbers ||
        numberOfSymbols < options.minSymbols
      ) {
        return { invalidPassword: true };
      }

      return null;
    };
  }
}
