import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';

export class ControlValidators {
  public static matchControlValue(matchTo: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const formControls = control.parent?.controls as Record<string, AbstractControl>;
      if (!formControls) {
        return null;
      }

      const matchToControl = formControls[matchTo];
      if (!matchToControl) {
        return null;
      }

      return control.value === matchToControl.value ? null : { notEqual: true };
    };
  }

  public static matchControlsValue(controlName: string, matchControlName: string): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const controls = (formGroup as FormGroup)?.controls;

      if (!controls) {
        return null;
      }

      const control = controls[controlName];
      const matchControl = controls[matchControlName];

      if (!control || !matchControl) {
        return null;
      }

      return control.value === matchControl.value ? null : { notEqual: true };
    };
  }
}
