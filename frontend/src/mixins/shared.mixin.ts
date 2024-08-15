/* eslint-disable @typescript-eslint/no-explicit-any */
import { FormControl, FormGroup } from "@angular/forms";

export class Empty {}

export type Constructor<T = Empty> = new (...args: any[]) => T;

export interface IForm<TFormType extends { [K in keyof TFormType]: FormControl<any>; }> {
  formGroup: FormGroup<TFormType>;
}
