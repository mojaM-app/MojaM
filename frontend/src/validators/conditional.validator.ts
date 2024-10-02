import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function conditionalValidator(
  predicateFn: () => boolean,
  validator: ValidatorFn
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.parent) {
      return null;
    }

    if (predicateFn()) {
      return validator(control);
    }

    return null;
  };
}
