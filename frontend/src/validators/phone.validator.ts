import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { REGEX_PATTERNS } from 'src/core/consts';

export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const phoneValidation = Validators.pattern(REGEX_PATTERNS.PHONE)(control);

    if (!phoneValidation) {
      return null;
    }

    return { invalid: true };
  };
}
