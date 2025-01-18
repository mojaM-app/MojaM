import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  model,
  OnInit,
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
import { MatStepperModule, StepperOrientation } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { VALIDATOR_SETTINGS } from 'src/core/consts';
import { DirectivesModule } from 'src/directives/directives.module';
import { WithForm } from 'src/mixins/with-form.mixin';
import { PipesModule } from 'src/pipes/pipes.module';
import { BrowserWindowService } from 'src/services/browser/browser-window.service';
import { SnackBarService } from 'src/services/snackbar/snack-bar.service';
import { GuidUtils } from 'src/utils/guid.utils';
import { ControlValidators } from 'src/validators/control.validators';
import { PasswordValidator } from 'src/validators/password.validator';
import { NewsMenu } from '../../news/news.menu';
import { ResetPasswordControlComponent } from '../reset-password/reset-password-control/reset-password-control.component';
import {
  ActivateAccountFormGroupNames,
  IActivateAccountForm,
  IdentityFormGroupControlNames,
  IIdentityFormGroup,
  ISetPasswordFormGroup,
  IUserInfoFormGroup,
  SetPasswordFormGroupControlNames,
  UserInfoFormGroupControlNames,
} from './activate-account.form';
import { IActivateAccountResult, IUserToActivate } from './interfaces/activate-account';
import { ActivateUserDto } from './models/user.model';
import { ActivateAccountService } from './services/activate-account.service';

@Component({
  selector: 'app-activate-account',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatStepperModule,
    MatCheckboxModule,
    FormsModule,
    PipesModule,
    DirectivesModule,
    ResetPasswordControlComponent,
  ],
  templateUrl: './activate-account.component.html',
  styleUrl: './activate-account.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivateAccountComponent extends WithForm<IActivateAccountForm>() implements OnInit {
  public readonly formGroupNames = ActivateAccountFormGroupNames;
  public readonly identityFormGroupControlNames = IdentityFormGroupControlNames;
  public readonly userInfoFormGroupControlNames = UserInfoFormGroupControlNames;
  public readonly setPasswordFormGroupControlNames = SetPasswordFormGroupControlNames;
  public readonly maxLengths = VALIDATOR_SETTINGS;
  public readonly user = model<IUserToActivate>();
  public readonly stepperOrientation: WritableSignal<StepperOrientation> =
    model<StepperOrientation>('horizontal');

  public constructor(
    formBuilder: FormBuilder,
    private _route: ActivatedRoute,
    private _router: Router,
    private _snackBarService: SnackBarService,
    private _activateAccountService: ActivateAccountService,
    private _browserWindowService: BrowserWindowService
  ) {
    const formGroup = formBuilder.group<IActivateAccountForm>({
      identity: formBuilder.group({
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
      userInfo: formBuilder.group({
        firstName: new FormControl<string | null>(null, {
          nonNullable: true,
          validators: [Validators.maxLength(VALIDATOR_SETTINGS.NAME_MAX_LENGTH)],
        }),
        lastName: new FormControl<string | null>(null, {
          nonNullable: true,
          validators: [Validators.maxLength(VALIDATOR_SETTINGS.NAME_MAX_LENGTH)],
        }),
        joiningDate: new FormControl<Date | null>(null, {
          nonNullable: true,
        }),
      }),
      setPassword: formBuilder.group(
        {
          password: new FormControl<string | null>(null, {
            nonNullable: true,
            validators: [Validators.required],
          }),
          confirmPassword: new FormControl<string | null>(null, {
            nonNullable: true,
            validators: [
              Validators.required,
              Validators.minLength(9),
              Validators.maxLength(50),
              PasswordValidator.strong(),
            ],
          }),
        },
        {
          validators: [
            ControlValidators.matchControlsValue(
              SetPasswordFormGroupControlNames.password,
              SetPasswordFormGroupControlNames.confirmPassword
            ),
          ],
        }
      ),
    } satisfies IActivateAccountForm);

    super(formGroup);

    effect(() => {
      const model = this.user();
      if (model) {
        formGroup.patchValue({
          identity: {
            email: model.email,
            emailConfirmed: false,
            phone: model.phone,
            phoneConfirmed: false,
          } satisfies { [K in keyof IIdentityFormGroup]: unknown },
          userInfo: {
            firstName: model.firstName,
            lastName: model.lastName,
            joiningDate: model.joiningDate,
          } satisfies { [K in keyof IUserInfoFormGroup]: unknown },
          setPassword: {
            password: null,
            confirmPassword: null,
          } satisfies { [K in keyof ISetPasswordFormGroup]: unknown },
        } satisfies { [K in keyof IActivateAccountForm]: unknown });
      }
    });

    this._browserWindowService.onResize$.subscribe(size => {
      this.stepperOrientation.set(size.width > 960 ? 'horizontal' : 'vertical');
    });
  }

  public ngOnInit(): void {
    const params = this._route.snapshot.params;
    const userUuid = params['userId'];

    if (!GuidUtils.isValidGuid(userUuid)) {
      this._router.navigate(['/not-found']);
      this._snackBarService.translateAndShowError('Errors/Invalid_Activated_Account_Identifier');
      return;
    }

    this._activateAccountService.get(userUuid).subscribe((result: IUserToActivate) => {
      if (result?.isLockedOut ?? false) {
        this.navigateToHomePage();
        this._snackBarService.translateAndShowError('Errors/Cannot_Activate_Locked_Account');
        return;
      }

      if (result?.isActive ?? true) {
        this.navigateToHomePage();
        this._snackBarService.translateAndShowSuccess('Login/AccountActivatedSuccessfully');
        return;
      }

      this.user.set(result);
    });
  }

  public save(): void {
    const params = this._route.snapshot.params;
    const userUuid = params['userId'];

    if (!GuidUtils.isValidGuid(userUuid) || !this.isReadyToSubmit()) {
      this.showErrors();
      return;
    }

    const dto = new ActivateUserDto(this.controls as unknown as IActivateAccountForm);
    this._activateAccountService
      .activate(userUuid, dto)
      .subscribe((result: IActivateAccountResult) => {
        if (result?.isActive ?? true) {
          this.navigateToHomePage();
          this._snackBarService.translateAndShowSuccess('Login/AccountActivatedSuccessfully');
        } else {
          this._snackBarService.translateAndShowError('Errors/Failed_To_Activate_Account');
        }
      });
  }

  public cancel(): void {
    this.navigateToHomePage();
  }

  private navigateToHomePage(): void {
    this._router.navigateByUrl(NewsMenu.Path);
  }
}
