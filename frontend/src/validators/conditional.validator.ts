import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function conditionalValidator(
  predicateFn: () => boolean,
  validator: ValidatorFn | ValidatorFn[]
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.parent) {
      return null;
    }

    if (predicateFn()) {
      return Array.isArray(validator)
        ? validator.reduce((errors, validatorFn) => {
            return { ...errors, ...validatorFn(control) };
          }, {})
        : validator(control);
    }

    return null;
  };
}
