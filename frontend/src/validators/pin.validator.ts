import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { REGEX_PATTERNS, VALIDATOR_SETTINGS } from 'src/core/consts';

export function pinValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    let validationResult = Validators.required(control);
    if (validationResult) {
      return validationResult;
    }

    validationResult =
      Validators.minLength(VALIDATOR_SETTINGS.PIN_LENGTH)(control) ||
      Validators.maxLength(VALIDATOR_SETTINGS.PIN_LENGTH)(control);
    if (validationResult) {
      return validationResult;
    }

    validationResult = Validators.pattern(REGEX_PATTERNS.PIN)(control);
    if (validationResult) {
      return validationResult;
    }

    if (!validationResult) {
      return null;
    }

    return { invalid: true };
  };
}
