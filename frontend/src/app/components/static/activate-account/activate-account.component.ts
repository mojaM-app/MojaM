import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  model,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule, StepperOrientation } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { PATHS } from 'src/app/app.routes';
import { SnackBarService } from 'src/app/components/static/snackbar/snack-bar.service';
import { VALIDATOR_SETTINGS } from 'src/core/consts';
import { DirectivesModule } from 'src/directives/directives.module';
import { WithForm } from 'src/mixins/with-form.mixin';
import { PipesModule } from 'src/pipes/pipes.module';
import { BrowserWindowService } from 'src/services/browser/browser-window.service';
import { GuidUtils } from 'src/utils/guid.utils';
import { ObjectUtils } from 'src/utils/object.utils';
import { conditionalValidator } from 'src/validators/conditional.validator';
import { ControlValidators } from 'src/validators/control.validators';
import { PasswordValidator } from 'src/validators/password.validator';
import { pinValidator } from 'src/validators/pin.validator';
import { NewsMenu } from '../../news/news.menu';
import { ResetPasswordControlComponent } from '../reset-passcode/reset-password/reset-password-control/reset-password-control.component';
import { ResetPinControlComponent } from '../reset-passcode/reset-pin/reset-pin-control/reset-pin-control.component';
import {
  IActivateAccountForm,
  IAuthenticationFormGroup,
  IContactFormGroup,
  IPersonalInfoFormGroup,
} from './activate-account.form';
import { AuthenticationTypes } from './enums/authentication-type.enum';
import { IAccountToActivate, IActivateAccountResult } from './interfaces/activate-account';
import { ActivateAccountDto } from './models/activate-account.model';
import { ActivateAccountService } from './services/activate-account.service';

@Component({
  selector: 'app-activate-account',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatStepperModule,
    MatSelectModule,
    MatCheckboxModule,
    FormsModule,
    PipesModule,
    DirectivesModule,
    ResetPasswordControlComponent,
    ResetPinControlComponent,
  ],
  templateUrl: './activate-account.component.html',
  styleUrl: './activate-account.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivateAccountComponent extends WithForm<IActivateAccountForm>() implements OnInit {
  protected readonly maxLengths = VALIDATOR_SETTINGS;
  protected readonly AuthenticationTypes = AuthenticationTypes;
  protected readonly stepperOrientation: WritableSignal<StepperOrientation> =
    model<StepperOrientation>('horizontal');
  protected readonly selectedAuthenticationType = model<AuthenticationTypes | null>(null);
  protected readonly user = signal<IAccountToActivate | null>(null);

  public constructor(
    formBuilder: FormBuilder,
    private _route: ActivatedRoute,
    private _router: Router,
    private _snackBarService: SnackBarService,
    private _activateAccountService: ActivateAccountService,
    private _browserWindowService: BrowserWindowService
  ) {
    const form = formBuilder.group<IActivateAccountForm>({
      contact: formBuilder.group<IContactFormGroup>({
        email: new FormControl<string | null>(null, {
          nonNullable: true,
          validators: [
            Validators.required,
            Validators.email,
            Validators.maxLength(VALIDATOR_SETTINGS.EMAIL_MAX_LENGTH),
          ],
        }),
        emailConfirmed: new FormControl<boolean>(false, {
          nonNullable: true,
        }),
        phone: new FormControl<string | null>(null, {
          nonNullable: true,
          validators: [
            Validators.required,
            Validators.maxLength(VALIDATOR_SETTINGS.PHONE_MAX_LENGTH),
          ],
        }),
        phoneConfirmed: new FormControl<boolean>(false, {
          nonNullable: true,
        }),
      }),
      personalInfo: formBuilder.group<IPersonalInfoFormGroup>({
        firstName: new FormControl<string | null>(null, {
          nonNullable: true,
          validators: [
            Validators.required,
            Validators.maxLength(VALIDATOR_SETTINGS.NAME_MAX_LENGTH),
          ],
        }),
        lastName: new FormControl<string | null>(null, {
          nonNullable: true,
          validators: [
            Validators.required,
            Validators.maxLength(VALIDATOR_SETTINGS.NAME_MAX_LENGTH),
          ],
        }),
        joiningDate: new FormControl<Date | null>(null, {
          nonNullable: true,
        }),
      }),
      authentication: formBuilder.group<IAuthenticationFormGroup>(
        {
          authenticationType: new FormControl<AuthenticationTypes | null>(null, {
            nonNullable: true,
            validators: [Validators.required],
          }),
          password: new FormControl<string | null>(null, {
            nonNullable: true,
            validators: [
              conditionalValidator(
                () => this.selectedAuthenticationType() === AuthenticationTypes.Password,
                Validators.required
              ),
            ],
          }),
          confirmPassword: new FormControl<string | null>(null, {
            nonNullable: true,
            validators: [
              conditionalValidator(
                () => this.selectedAuthenticationType() === AuthenticationTypes.Password,
                [
                  Validators.required,
                  Validators.minLength(VALIDATOR_SETTINGS.STRONG_PASSWORD_OPTIONS.minLength),
                  Validators.maxLength(VALIDATOR_SETTINGS.PASSWORD_MAX_LENGTH),
                  PasswordValidator.strong(),
                ]
              ),
            ],
          }),
          pin: new FormControl<string | null>(null, {
            nonNullable: true,
            validators: [
              conditionalValidator(
                () => this.selectedAuthenticationType() === AuthenticationTypes.Pin,
                Validators.required
              ),
            ],
          }),
          confirmPin: new FormControl<string | null>(null, {
            nonNullable: true,
            validators: [
              conditionalValidator(
                () => this.selectedAuthenticationType() === AuthenticationTypes.Pin,
                pinValidator()
              ),
            ],
          }),
        },
        {
          validators: [
            conditionalValidator(
              () => this.selectedAuthenticationType() === AuthenticationTypes.Password,
              ControlValidators.matchControlsValue(
                ObjectUtils.nameOf<IAuthenticationFormGroup>(p => p.password),
                ObjectUtils.nameOf<IAuthenticationFormGroup>(p => p.confirmPassword)
              )
            ),
            conditionalValidator(
              () => this.selectedAuthenticationType() === AuthenticationTypes.Pin,
              ControlValidators.matchControlsValue(
                ObjectUtils.nameOf<IAuthenticationFormGroup>(p => p.pin),
                ObjectUtils.nameOf<IAuthenticationFormGroup>(p => p.confirmPin)
              )
            ),
          ],
        }
      ),
    } satisfies IActivateAccountForm);

    super(form);

    this._browserWindowService.onResize$.subscribe(size => {
      this.stepperOrientation.set(size.width > 960 ? 'horizontal' : 'vertical');
    });
  }

  public ngOnInit(): void {
    const params = this._route.snapshot.params;
    const userUuid = params['userId'];

    if (!GuidUtils.isValidGuid(userUuid)) {
      this._router.navigate(['/' + PATHS.NotFound]);
      this._snackBarService.translateAndShowError({
        message: 'Errors/Invalid_Activated_Account_Identifier',
      });
      return;
    }

    this._activateAccountService.get(userUuid).subscribe((result: IAccountToActivate) => {
      if (result?.isLockedOut ?? false) {
        this.navigateToHomePage();
        this._snackBarService.translateAndShowError({
          message: 'Errors/Cannot_Activate_Locked_Account',
        });
        return;
      }

      if (result?.isActive ?? true) {
        this.navigateToHomePage();
        this._snackBarService.translateAndShowSuccess({
          message: 'Login/AccountActivatedSuccessfully',
        });
        return;
      }

      this.setFormValues(result);
    });
  }

  protected save(): void {
    const params = this._route.snapshot.params;
    const userId = params['userId'];

    if (!GuidUtils.isValidGuid(userId) || !this.isReadyToSubmit()) {
      this.showErrors();
      return;
    }

    const dto = new ActivateAccountDto(this.formGroup);
    this._activateAccountService
      .activate(userId, dto)
      .subscribe((result: IActivateAccountResult) => {
        if (result?.isActive ?? true) {
          this.navigateToHomePage();
          this._snackBarService.translateAndShowSuccess({
            message: 'Login/AccountActivatedSuccessfully',
          });
        } else {
          this._snackBarService.translateAndShowError({
            message: 'Errors/Failed_To_Activate_Account',
          });
        }
      });
  }

  protected cancel(): void {
    this.navigateToHomePage();
  }

  private navigateToHomePage(): void {
    this._router.navigateByUrl(NewsMenu.Path);
  }

  private setFormValues(user: IAccountToActivate | null): void {
    if (user) {
      this.formGroup.patchValue({
        contact: {
          email: user.email,
          emailConfirmed: false,
          phone: user.phone,
          phoneConfirmed: false,
        } satisfies { [K in keyof IContactFormGroup]: unknown },
        personalInfo: {
          firstName: user.firstName,
          lastName: user.lastName,
          joiningDate: user.joiningDate,
        } satisfies { [K in keyof IPersonalInfoFormGroup]: unknown },
        authentication: {
          authenticationType: null,
          password: null,
          confirmPassword: null,
          pin: null,
          confirmPin: null,
        } satisfies { [K in keyof IAuthenticationFormGroup]: unknown },
      } satisfies { [K in keyof IActivateAccountForm]: unknown });
    }

    this.user.set(user);
  }
}
