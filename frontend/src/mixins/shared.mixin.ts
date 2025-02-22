import { AbstractControl, FormGroup } from '@angular/forms';

export class Empty {}

export type Constructor<T = Empty> = new (...args: any[]) => T;

export interface IForm<TFormType extends { [K in keyof TFormType]: AbstractControl<any> }> {
  formGroup: FormGroup<TFormType>;
}
