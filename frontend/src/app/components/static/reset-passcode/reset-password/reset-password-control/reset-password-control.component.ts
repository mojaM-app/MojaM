import { ChangeDetectionStrategy, Component, computed, input, Signal, signal } from '@angular/core';
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
import { IResetPasswordForm } from '../../reset-passcode.form';

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
  public readonly formGroup = input.required<FormGroup>();
  protected readonly form: Signal<FormGroup<IResetPasswordForm>>;
  protected readonly errorNames = errorNames;
  protected readonly hideConfirmPassword = signal(true);
  protected readonly hidePassword = signal(true);

  public constructor() {
    this.form = computed(() => this.formGroup() as FormGroup<IResetPasswordForm>);
  }

  protected getControlErrors(control: AbstractControl): ValidationErrors {
    return control?.errors ?? {};
  }

  protected getFormGroupErrors(): ValidationErrors {
    return this.form().errors ?? {};
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
