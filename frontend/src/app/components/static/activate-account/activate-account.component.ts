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
import { PATHS } from 'src/app/app.routes';
import { SnackBarService } from 'src/app/components/static/snackbar/snack-bar.service';
import { VALIDATOR_SETTINGS } from 'src/core/consts';
import { DirectivesModule } from 'src/directives/directives.module';
import { WithForm } from 'src/mixins/with-form.mixin';
import { PipesModule } from 'src/pipes/pipes.module';
import { BrowserWindowService } from 'src/services/browser/browser-window.service';
import { GuidUtils } from 'src/utils/guid.utils';
import { ObjectUtils } from 'src/utils/object.utils';
import { ControlValidators } from 'src/validators/control.validators';
import { PasswordValidator } from 'src/validators/password.validator';
import { NewsMenu } from '../../news/news.menu';
import { ResetPasswordControlComponent } from '../reset-password/reset-password-control/reset-password-control.component';
import {
  IActivateAccountForm,
  IIdentityFormGroup,
  ISetPasswordFormGroup,
  IUserInfoFormGroup,
} from './activate-account.form';
import { IActivateAccountResult, IUserToActivate } from './interfaces/activate-account';
import { ActivateUserDto } from './models/user.model';
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
  protected readonly maxLengths = VALIDATOR_SETTINGS;
  protected readonly user = model<IUserToActivate>();
  protected readonly stepperOrientation: WritableSignal<StepperOrientation> =
    model<StepperOrientation>('horizontal');

  public constructor(
    formBuilder: FormBuilder,
    private _route: ActivatedRoute,
    private _router: Router,
    private _snackBarService: SnackBarService,
    private _activateAccountService: ActivateAccountService,
    private _browserWindowService: BrowserWindowService
  ) {
    const form = formBuilder.group<IActivateAccountForm>({
      identity: formBuilder.group<IIdentityFormGroup>({
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
      userInfo: formBuilder.group<IUserInfoFormGroup>({
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
      setPassword: formBuilder.group<ISetPasswordFormGroup>(
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
              ObjectUtils.nameOf<ISetPasswordFormGroup>(p => p.password),
              ObjectUtils.nameOf<ISetPasswordFormGroup>(p => p.confirmPassword)
            ),
          ],
        }
      ),
    } satisfies IActivateAccountForm);

    super(form);

    effect(() => {
      const model = this.user();
      if (model) {
        this.formGroup.patchValue({
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
      this._router.navigate(['/' + PATHS.NotFound]);
      this._snackBarService.translateAndShowError({
        message: 'Errors/Invalid_Activated_Account_Identifier',
      });
      return;
    }

    this._activateAccountService.get(userUuid).subscribe((result: IUserToActivate) => {
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

      this.user.set(result);
    });
  }

  protected save(): void {
    const params = this._route.snapshot.params;
    const userId = params['userId'];

    if (!GuidUtils.isValidGuid(userId) || !this.isReadyToSubmit()) {
      this.showErrors();
      return;
    }

    const dto = new ActivateUserDto(this.formGroup);
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
}
