import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
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
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { IS_MOBILE } from 'src/app/app.config';
import { ResetPasswordService } from 'src/app/components/static/reset-password/services/reset-password.service';
import { SnackBarService } from 'src/app/components/static/snackbar/snack-bar.service';
import { environment } from 'src/environments/environment';
import { IUserInfoBeforeLogInDto } from 'src/interfaces/auth/auth.models';
import { IResponseError } from 'src/interfaces/errors/response.error';
import { WithForm } from 'src/mixins/with-form.mixin';
import { PipesModule } from 'src/pipes/pipes.module';
import { AuthTokenService } from 'src/services/auth/auth-token.service';
import { AuthService } from 'src/services/auth/auth.service';
import { conditionalValidator } from 'src/validators/conditional.validator';
import { phoneValidator } from 'src/validators/phone.validator';
import { RequestResetPasswordDto } from '../../reset-password/models/reset-password.models';
import { ILoginForm, LoginFormControlNames, LoginFormSteps } from './login.form';

@Component({
  selector: 'app-login-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    PipesModule,
    ReactiveFormsModule,
  ],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss',
})
export class LoginFormComponent extends WithForm<ILoginForm>() {
  public afterLogIn = output<boolean>();
  public readonly formControlNames = LoginFormControlNames;
  public readonly formSteps = LoginFormSteps;

  public showStep = signal<LoginFormSteps>(LoginFormSteps.EnterEmail);
  public loginError = signal<string | undefined>(undefined);
  public showResetPasswordButton = signal<boolean>(false);
  public hidePassword = signal(true);

  private _emailInput = viewChild('emailInput', { read: ElementRef });
  private _phoneInput = viewChild('phoneInput', { read: ElementRef });
  private _passwordInput = viewChild('passwordInput', { read: ElementRef });

  public constructor(
    formBuilder: FormBuilder,
    private _authService: AuthService,
    private _authTokenService: AuthTokenService,
    private _snackBarService: SnackBarService,
    private _resetPasswordService: ResetPasswordService,
    @Inject(IS_MOBILE) private _isMobile: boolean
  ) {
    const formGroup = formBuilder.group<ILoginForm>({
      email: new FormControl(null, { validators: [Validators.required, Validators.email] }),
      phone: new FormControl(null, {
        validators: [
          conditionalValidator(
            () => this.showStep() === LoginFormSteps.EnterPhone,
            Validators.required
          ),
          phoneValidator(),
        ],
      }),
      password: new FormControl(null, { validators: [Validators.required] }),
    } satisfies ILoginForm);

    super(formGroup);

    if (environment.production === false) {
      formGroup.patchValue({
        email: 'admin@domain.com',
        password: 'P@ssWord!1',
      });
    }
  }

  public login(): void {
    if (!this.isReadyToSubmit()) {
      this.showErrors();
      return;
    }

    this._authService
      .login(this.controls.email.value, this.controls.phone.value, this.controls.password.value)
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

  public goToStepEnterEmail(): void {
    this.showStep.set(LoginFormSteps.EnterEmail);
    this.loginError.set('');
    this.focusEmailInput();
  }

  public goToStepEnterPhone(): void {
    const controlEmail = this.controls.email;
    const email = controlEmail.value;
    if (!controlEmail.valid || !email) {
      return;
    }

    this._authService
      .getUserInfoBeforeLogIn(email)
      .subscribe((response: IUserInfoBeforeLogInDto) => {
        if (response?.isActive === false) {
          this.goToStepUserNotActive();
          return;
        }

        this.showResetPasswordButton.set(response.isPasswordSet === true);

        if (response.isPhoneRequired === true) {
          this.showStep.set(LoginFormSteps.EnterPhone);
          this.focusPhoneInput();
          return;
        }

        if (response.isPasswordSet === true) {
          this.goToStepEnterPassword();
        } else {
          this.goToStepResetPassword();
        }
      });
  }

  public goToStepEnterPassword(): void {
    const showStepEnterPassword = (): void => {
      this.showStep.set(LoginFormSteps.EnterPassword);
      this.focusPasswordInput();
    };

    if (this.showStep() === LoginFormSteps.EnterPhone) {
      const controlPhone = this.controls.phone;
      const phone = controlPhone.value;
      if (!controlPhone.valid || !phone) {
        return;
      }

      this._authService
        .getUserInfoBeforeLogIn(this.controls.email.value, phone)
        .subscribe((response: IUserInfoBeforeLogInDto) => {
          if (response?.isActive === false) {
            this.goToStepUserNotActive();
            return;
          }

          this.showResetPasswordButton.set(response.isPasswordSet === true);

          if (response.isPasswordSet === true) {
            showStepEnterPassword();
          } else {
            this.goToStepResetPassword();
          }
        });
    } else {
      showStepEnterPassword();
    }
  }

  public goToStepResetPassword(): void {
    this.loginError.set(undefined);
    this.showStep.set(LoginFormSteps.ResetPassword);
  }

  public requestResetPassword(): void {
    this._resetPasswordService
      .requestResetPassword(
        new RequestResetPasswordDto(this.controls.email.value, this.controls.phone.value)
      )
      .subscribe({
        next: () => {
          this.loginError.set('');
          this.goToStepEnterPassword();
          this._snackBarService.translateAndShowSuccess({
            message: 'Login/RequestResetPasswordSent',
          });
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

  public goToStepForgotPassword(): void {
    this.loginError.set(undefined);
    this.showStep.set(LoginFormSteps.ForgotPassword);
  }

  public focusEmailInput(): void {
    setTimeout(() => this._emailInput()?.nativeElement.focus(), 100);
  }

  public setLoginData(): void {
    const email = this._authTokenService.getUserEmail();
    this.controls.email.setValue(email);
    this.goToStepEnterPhone();
  }

  public togglePasswordVisibility(event: MouseEvent): void {
    if (
      event instanceof PointerEvent &&
      (event.pointerType === 'mouse' || event.pointerType === 'touch')
    ) {
      this.hidePassword.set(!this.hidePassword());
    }
    event.stopPropagation();
  }

  private focusPhoneInput(): void {
    setTimeout(() => this._phoneInput()?.nativeElement.focus(), 100);
  }

  private focusPasswordInput(): void {
    setTimeout(() => this._passwordInput()?.nativeElement.focus(), 100);
  }

  private goToStepUserNotActive(): void {
    this.loginError.set(undefined);
    this.showStep.set(LoginFormSteps.UserNotActive);
  }
}
