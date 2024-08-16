/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { FormControl, FormGroup } from '@angular/forms';
import { Constructor, Empty, IForm } from './shared.mixin';

export function WithForm<
  TFormType extends { [K in keyof TFormType]: FormControl<any> },
  T extends Constructor = Constructor<Empty>,
>(Base: T = Empty as T) {
  return class extends Base implements IForm<TFormType> {
    public formGroup: FormGroup<TFormType>;

    public constructor(...args: any[]) {
      super(...args);
      const formGroup: FormGroup<TFormType> = args?.length > 0 ? args[0] : null;
      if (!formGroup) {
        throw new Error('FormGroup is required. args must contain a FormGroup.');
      }
      this.formGroup = formGroup;
    }

    public get formControls(): { [K in keyof TFormType]: FormControl<any> } {
      return this.formGroup.controls as { [K in keyof TFormType]: FormControl<any> };
    }

    public get isValid(): boolean {
      return this.formGroup.valid;
    }

    public get hasErrors(): boolean {
        return this.formGroup.errors != null;
    }

    public control<K extends keyof TFormType>(name: K | string): FormControl<any> {
      return this.formGroup.controls[name] as FormControl<any>;
    }

    public isRedyToSubmit(): boolean {
      return this.isValid && !this.hasErrors;
    }
  };
}
