import { FocusMonitor } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Inject,
  OnDestroy,
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
import { ResetPasscodeService } from 'src/app/components/static/reset-passcode/services/reset-passcode.service';
import { SnackBarService } from 'src/app/components/static/snackbar/snack-bar.service';
import { environment } from 'src/environments/environment';
import { IResponseError } from 'src/interfaces/errors/response.error';
import { WithForm } from 'src/mixins/with-form.mixin';
import { PipesModule } from 'src/pipes/pipes.module';
import { AuthTokenService } from 'src/services/auth/auth-token.service';
import { AuthService } from 'src/services/auth/auth.service';
import { AccountBeforeLogIn } from 'src/services/auth/models/account-before-logIn';
import { conditionalValidator } from 'src/validators/conditional.validator';
import { phoneValidator } from 'src/validators/phone.validator';
import { pinValidator } from 'src/validators/pin.validator';
import { AuthenticationTypes } from '../../activate-account/enums/authentication-type.enum';
import { RequestResetPasscodeDto } from '../../reset-passcode/models/reset-passcode.models';
import { MatOtpInputComponent } from '../../reset-passcode/reset-pin/reset-pin-control/mat-otp-input/mat-otp-input.component';
import { ILoginForm, LoginFormSteps } from './login.form';

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
    MatOtpInputComponent,
  ],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss',
})
export class LoginFormComponent extends WithForm<ILoginForm>() implements OnDestroy {
  public afterLogIn = output<boolean>();

  protected readonly formSteps = LoginFormSteps;
  protected currentStep = signal<LoginFormSteps>(LoginFormSteps.EnterEmail);
  protected loginError = signal<string | undefined>(undefined);
  protected showResetPasscodeButton = signal<boolean>(false);
  protected hidePasscode = signal(true);
  protected authType = signal<AuthenticationTypes | undefined>(undefined);
  protected AuthenticationTypes = AuthenticationTypes;

  private _emailInput = viewChild('emailInput', { read: ElementRef });
  private _phoneInput = viewChild('phoneInput', { read: ElementRef });
  private _passwordInput = viewChild('passwordInput', { read: ElementRef });
  private _pinInput = viewChild(MatOtpInputComponent);

  private readonly _focusMonitor = inject(FocusMonitor);
  private readonly _elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  public constructor(
    formBuilder: FormBuilder,
    private _authService: AuthService,
    private _authTokenService: AuthTokenService,
    private _snackBarService: SnackBarService,
    private _resetPasswordService: ResetPasscodeService,
    @Inject(IS_MOBILE) private _isMobile: boolean
  ) {
    const formGroup = formBuilder.group<ILoginForm>({
      email: new FormControl(null, { validators: [Validators.required, Validators.email] }),
      phone: new FormControl(null, {
        validators: [
          conditionalValidator(
            () => this.currentStep() === LoginFormSteps.EnterPhone,
            Validators.required
          ),
          phoneValidator(),
        ],
      }),
      passcode: new FormControl(null, {
        validators: [
          Validators.required,
          conditionalValidator(() => this.authType() === AuthenticationTypes.Pin, pinValidator()),
        ],
      }),
    } satisfies ILoginForm);

    super(formGroup);

    if (environment.production === false) {
      formGroup.patchValue({
        email: 'admin@domain.com',
        passcode: 'P@ssWord!1',
      });
    }
  }

  public ngOnDestroy(): void {
    this._focusMonitor.stopMonitoring(this._elementRef);
  }

  public setLoginData(): void {
    const email = this._authTokenService.getUserEmail();
    this.controls.email.setValue(email);
    this.goToStepEnterPhone();
  }

  public focusEmailInput(): void {
    setTimeout(() => {
      this._focusMonitor.focusVia(this._emailInput()?.nativeElement, 'program');
    }, 100);
  }

  protected login(): void {
    if (!this.isReadyToSubmit()) {
      this.showErrors();
      return;
    }

    this._authService
      .login(this.controls.email.value, this.controls.phone.value, this.controls.passcode.value)
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

  protected goToStepEnterEmail(): void {
    this.currentStep.set(LoginFormSteps.EnterEmail);
    this.loginError.set('');
    this.focusEmailInput();
  }

  protected goToStepEnterPhone(): void {
    const controlEmail = this.controls.email;
    const email = controlEmail.value;
    if (!controlEmail.valid || !email) {
      return;
    }

    this._authService.getAccountBeforeLogIn(email).subscribe((response: AccountBeforeLogIn) => {
      if (response.isActive() !== true) {
        this.goToStepUserNotActive();
        return;
      }

      this.showResetPasscodeButton.set(response.isPasswordSet() || response.isPinSet());
      this.authType.set(response.getAuthType());

      if (response.isPhoneRequired()) {
        this.currentStep.set(LoginFormSteps.EnterPhone);
        this.focusPhoneInput();
        return;
      }

      if (response.isPasswordSet()) {
        this.goToStepEnterPassword();
      } else if (response.isPinSet()) {
        this.goToStepEnterPin();
      } else {
        this.showStepAuthenticationTypeNotSet();
      }
    });
  }

  protected goToStepEnterPassword(): void {
    const showStepEnterPassword = (): void => {
      this.currentStep.set(LoginFormSteps.EnterPassword);
      this.focusPasscodeInput();
    };

    if (this.currentStep() === LoginFormSteps.EnterPhone) {
      const controlPhone = this.controls.phone;
      const phone = controlPhone.value;
      if (!controlPhone.valid || !phone) {
        return;
      }

      this._authService
        .getAccountBeforeLogIn(this.controls.email.value, phone)
        .subscribe((response: AccountBeforeLogIn) => {
          if (response.isActive() !== true) {
            this.goToStepUserNotActive();
            return;
          }

          this.showResetPasscodeButton.set(response.isPasswordSet());
          this.authType.set(response.getAuthType());

          if (response.isPasswordSet()) {
            this.goToStepEnterPassword();
          } else if (response.isPinSet()) {
            this.goToStepEnterPin();
          } else {
            this.showStepAuthenticationTypeNotSet();
          }
        });
    } else {
      showStepEnterPassword();
    }
  }

  protected goToStepEnterPin(): void {
    const showStepEnterPin = (): void => {
      this.currentStep.set(LoginFormSteps.EnterPin);
      this.focusPasscodeInput();
    };

    if (this.currentStep() === LoginFormSteps.EnterPhone) {
      const controlPhone = this.controls.phone;
      const phone = controlPhone.value;
      if (!controlPhone.valid || !phone) {
        return;
      }

      this._authService
        .getAccountBeforeLogIn(this.controls.email.value, phone)
        .subscribe((response: AccountBeforeLogIn) => {
          if (response.isActive() !== true) {
            this.goToStepUserNotActive();
            return;
          }

          this.showResetPasscodeButton.set(response.isPinSet());
          this.authType.set(response.getAuthType());

          if (response.isPasswordSet()) {
            this.goToStepEnterPassword();
          } else if (response.isPinSet()) {
            this.goToStepEnterPin();
          } else {
            this.showStepAuthenticationTypeNotSet();
          }
        });
    } else {
      showStepEnterPin();
    }
  }

  protected showStepAuthenticationTypeNotSet(): void {
    this.loginError.set(undefined);
    this.currentStep.set(LoginFormSteps.AuthenticationTypeNotSet);
  }

  protected requestResetPasscode(): void {
    this._resetPasswordService
      .requestResetPasscode(
        new RequestResetPasscodeDto(this.controls.email.value, this.controls.phone.value)
      )
      .subscribe({
        next: () => {
          this.loginError.set('');

          switch (this.authType()) {
            case AuthenticationTypes.Password:
              this.goToStepEnterPassword();
              this._snackBarService.translateAndShowSuccess({
                message: 'Login/RequestResetPasswordSent',
              });
              break;
            case AuthenticationTypes.Pin:
              this.goToStepEnterPin();
              this._snackBarService.translateAndShowSuccess({
                message: 'Login/RequestResetPinSent',
              });
              break;
            default:
              throw new Error('Invalid authentication type');
          }
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

  protected goToStepForgotPassword(): void {
    this.loginError.set(undefined);
    this.currentStep.set(LoginFormSteps.ResetPasscode);
  }

  protected togglePasscodeVisibility(event: MouseEvent): void {
    if (
      event instanceof PointerEvent &&
      (event.pointerType === 'mouse' || event.pointerType === 'touch')
    ) {
      this.hidePasscode.set(!this.hidePasscode());
    }
    event.stopPropagation();
  }

  private focusPhoneInput(): void {
    setTimeout(() => {
      this._phoneInput()?.nativeElement.focus();
    }, 100);
  }

  private focusPasscodeInput(): void {
    setTimeout(() => {
      this._passwordInput()?.nativeElement.focus();
      this._pinInput()?.focusFirstInput();
    }, 100);
  }

  private goToStepUserNotActive(): void {
    this.loginError.set(undefined);
    this.currentStep.set(LoginFormSteps.UserNotActive);
  }
}
