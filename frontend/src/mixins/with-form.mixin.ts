/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { FormArray, FormControl, FormGroup, ValidationErrors } from '@angular/forms';
import { Constructor, Empty, IForm } from './shared.mixin';

export function WithForm<
  TFormType extends {
    [K in keyof TFormType]: FormControl<any> | FormGroup<any> | FormArray<any>;
  } = any,
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

    public get value(): TFormType {
      return this.formGroup.value as any;
    }

    public get controls(): { [K in keyof TFormType]: FormControl<any> } {
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

    public group<K extends keyof TFormType>(name: K | string): FormGroup<any> {
      return this.formGroup.controls[name] as FormGroup<any>;
    }

    public array<K extends keyof TFormType>(name: K | string): FormArray<any> {
      return this.formGroup.controls[name] as FormArray<any>;
    }

    public getErrors<K extends keyof TFormType>(name: K | string): ValidationErrors {
      return this.control(name)?.errors || {};
    }

    public getFormGroupErrors(): ValidationErrors {
      return this.formGroup.errors || {};
    }

    public isReadyToSubmit(): boolean {
      return this.isValid && !this.hasErrors;
    }
  };
}
