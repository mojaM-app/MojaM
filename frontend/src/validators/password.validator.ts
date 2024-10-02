import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

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
      minLength: 9,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 0,
      minSymbols: 0,
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
      const numberOfSymbols = value.length - numberOfLowercase - numberOfUppercase - numberOfNumbers;

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
