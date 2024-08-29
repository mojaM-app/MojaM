import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const phoneValidation = Validators.pattern(
      /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{3})$/
    )(control);

    if (!phoneValidation) {
      return null;
    }

    return { invalid: true };
  };
}
