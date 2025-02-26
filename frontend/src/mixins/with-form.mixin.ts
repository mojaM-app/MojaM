/* eslint-disable @typescript-eslint/explicit-function-return-type */

import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ValidationErrors,
} from '@angular/forms';
import { errorNames } from 'src/validators/error-names.const';
import { Constructor, Empty, IForm } from './shared.mixin';

export function WithForm<
  TFormType extends {
    [K in keyof TFormType]: FormControl<any> | FormGroup<any> | FormArray<any>;
  } = any,
  T extends Constructor = Constructor<Empty>,
>(Base: T = Empty as T) {
  return class extends Base implements IForm<TFormType> {
    public readonly errorNames = errorNames;
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

    public showErrors(): void {
      this.formGroup.markAllAsTouched();
    }

    protected isReadyToSubmit(): boolean {
      return this.isValid && !this.hasErrors;
    }

    protected getFormGroupErrors(): ValidationErrors {
      return this.formGroup.errors || {};
    }

    protected getName(control: AbstractControl): string {
      const group = control.parent as FormGroup;

      if (!group) {
        throw new Error('Control must have a parent FormGroup.');
      }

      for (const key of Object.keys(group.controls)) {
        const childControl = group.get(key);

        if (childControl === control) {
          return key;
        }
      }

      throw new Error('Control must be a child of the parent FormGroup.');
    }

    private control<K extends keyof TFormType>(name: K | string): FormControl<any> {
      return this.formGroup.controls[name] as FormControl<any>;
    }

    private group<K extends keyof TFormType>(name: K | string): FormGroup<any> {
      return this.formGroup.controls[name] as FormGroup<any>;
    }

    private array<K extends keyof TFormType>(name: K | string): FormArray<any> {
      return this.formGroup.controls[name] as FormArray<any>;
    }
  };
}
