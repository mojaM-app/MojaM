/* eslint-disable @angular-eslint/no-forward-ref */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  Signal,
  signal,
} from '@angular/core';
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
import { IResetPinForm } from '../../reset-pin.form';
import { MatOtpInputComponent } from './mat-otp-input/mat-otp-input.component';

@Component({
  selector: 'app-reset-pin-control',
  imports: [
    FormsModule,
    PipesModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    forwardRef(() => MatOtpInputComponent),
  ],
  templateUrl: './reset-pin-control.component.html',
  styleUrl: './reset-pin-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPinControlComponent {
  public readonly formGroup = input.required<FormGroup>();
  protected readonly form: Signal<FormGroup<IResetPinForm>>;
  protected readonly errorNames = errorNames;
  protected readonly hideConfirmPin = signal(true);
  protected readonly hidePin = signal(true);

  public constructor() {
    this.form = computed(() => this.formGroup() as FormGroup<IResetPinForm>);
  }

  protected getControlErrors(control: AbstractControl): ValidationErrors {
    return control?.errors ?? {};
  }

  protected getFormGroupErrors(): ValidationErrors {
    return this.form().errors ?? {};
  }

  protected togglePinVisibility(event: MouseEvent): void {
    this.hidePin.set(!this.hidePin());
    event.stopPropagation();
  }

  protected toggleConfirmPinVisibility(event: MouseEvent): void {
    this.hideConfirmPin.set(!this.hideConfirmPin());
    event.stopPropagation();
  }
}
