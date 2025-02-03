import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PipesModule } from 'src/pipes/pipes.module';
import { errorNames } from 'src/validators/error-names.const';
import { IResetPasswordForm, ResetPasswordFormControlNames } from '../reset-password.form';

@Component({
  selector: 'app-reset-password-control',
  imports: [
    FormsModule,
    PipesModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './reset-password-control.component.html',
  styleUrl: './reset-password-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordControlComponent {
  public readonly errorNames = errorNames;
  public readonly formControlNames = ResetPasswordFormControlNames;
  public readonly hideConfirmPassword = signal(true);
  public readonly hidePassword = signal(true);
  public formGroup = input.required<FormGroup<IResetPasswordForm>>();

  public get controls(): IResetPasswordForm {
    return this.formGroup().controls;
  }

  public control(name: string): FormControl<any> {
    return (this.controls as any)[name] as FormControl<any>;
  }

  public getErrors(name: string): ValidationErrors {
    return this.control(name)?.errors || {};
  }

  public getFormGroupErrors(): ValidationErrors {
    return this.formGroup().errors || {};
  }

  public togglePasswordVisibility(event: MouseEvent): void {
    this.hidePassword.set(!this.hidePassword());
    event.stopPropagation();
  }

  public toggleConfirmPasswordVisibility(event: MouseEvent): void {
    this.hideConfirmPassword.set(!this.hideConfirmPassword());
    event.stopPropagation();
  }
}
