import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { IResponseError } from 'src/interfaces/errors/response.error';
import { WithForm } from 'src/mixins/with-form.mixin';
import { PipesModule } from 'src/pipes/pipes.module';
import { AuthService } from 'src/services/auth/auth.service';
import { ILoginForm, LoginFormControlNames } from './login.form';
import { MatButton } from '@angular/material/button';
import { conditionalValidator } from 'src/validators/conditional-validator';
import { phoneValidator } from 'src/validators/phone.validator';

@Component({
  selector: 'app-login-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatButton,
    MatFormFieldModule,
    MatInputModule,
    PipesModule,
    ReactiveFormsModule,
  ],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss',
})
export class LoginFormComponent extends WithForm<ILoginForm>() {
  public afterLogIn = output<boolean>();
  public readonly formControlNames = LoginFormControlNames;

  public showStepOne = signal<boolean>(true);
  public showStepTwo = signal<boolean>(false);
  public showStepThree = signal<boolean>(false);
  public loginError = signal<string | undefined>(undefined);

  private _emailInput = viewChild('emailInput', { read: ElementRef });
  private _phoneInput = viewChild('phoneInput', { read: ElementRef });
  private _passwordInput = viewChild('passwordInput', { read: ElementRef });

  public constructor(
    formBuilder: FormBuilder,
    private _authService: AuthService
  ) {
    const formGroup = formBuilder.group<ILoginForm>({
      email: new FormControl(null, { validators: [Validators.required, Validators.email] }),
      phone: new FormControl(null, {
        validators: [
          conditionalValidator(() => this.showStepTwo() === true, Validators.required),
          phoneValidator(),
        ],
      }),
      password: new FormControl(null, { validators: [Validators.required] }),
    } satisfies ILoginForm);
    super(formGroup);

    this.formGroup.patchValue({
      email: 'admin@domain.com',
      phone: '123456789',
      password: 'P@ssWord!1',
    });
  }

  public login(): void {
    if (this.isRedyToSubmit() !== true) {
      return;
    }

    this._authService
      .login(
        this.formControls.email.value,
        this.formControls.phone.value,
        this.formControls.password.value
      )
      .subscribe({
        next: () => {
          this.afterLogIn.emit(true);
        },
        error: (error: unknown) => {
          if ((error as IResponseError)?.errorMessage) {
            this.loginError.set((error as IResponseError).errorMessage);
          } else {
            throw error;
          }
        },
      });
  }

  public goToStepOne(): void {
    this.showStepTwo.set(false);
    this.showStepThree.set(false);
    this.showStepOne.set(true);
    this.focusEmailInput();
  }

  public goToStepTwo(): void {
    const control = this.formControls.email;
    const value = control.value;
    if (!control.valid || !value) {
      return;
    }

    this._authService.isEmailSufficientToLogIn(value).subscribe((isEmailSufficient: boolean) => {
      this.showStepOne.set(false);
      if (isEmailSufficient) {
        this.goToStepThree();
      } else {
        this.showStepTwo.set(true);
        this.focusPhoneInput();
      }
    });
  }

  public goToStepThree(): void {
    if (this.showStepTwo() === true) {
      const control = this.formControls.phone;
      const value = control.value;
      if (!control.valid || !value) {
        return;
      }
    }

    this.showStepTwo.set(false);
    this.showStepThree.set(true);
    this.focusPasswordInput();
  }

  public focusEmailInput(): void {
    setTimeout(() => this._emailInput()?.nativeElement.focus(), 100);
  }

  private focusPhoneInput(): void {
    setTimeout(() => this._phoneInput()?.nativeElement.focus(), 100);
  }

  private focusPasswordInput(): void {
    setTimeout(() => this._passwordInput()?.nativeElement.focus(), 100);
  }
}
