import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import {
  AbstractControl,
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
import { IResetPasswordForm } from '../reset-password.form';

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
  public readonly formGroup = input.required<FormGroup<IResetPasswordForm>>();

  protected readonly errorNames = errorNames;
  protected readonly hideConfirmPassword = signal(true);
  protected readonly hidePassword = signal(true);

  public getControlErrors(control: AbstractControl): ValidationErrors {
    return control?.errors ?? {};
  }

  public getFormGroupErrors(): ValidationErrors {
    return this.formGroup().errors ?? {};
  }

  protected togglePasswordVisibility(event: MouseEvent): void {
    this.hidePassword.set(!this.hidePassword());
    event.stopPropagation();
  }

  protected toggleConfirmPasswordVisibility(event: MouseEvent): void {
    this.hideConfirmPassword.set(!this.hideConfirmPassword());
    event.stopPropagation();
  }
}
