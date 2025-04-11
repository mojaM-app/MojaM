import { ChangeDetectionStrategy, Component, input } from '@angular/core';
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
import { Router } from '@angular/router';
import { ResetPasscodeService } from 'src/app/components/static/reset-passcode/services/reset-passcode.service';
import { SnackBarService } from 'src/app/components/static/snackbar/snack-bar.service';
import { VALIDATOR_SETTINGS } from 'src/core/consts';
import { WithForm } from 'src/mixins/with-form.mixin';
import { PipesModule } from 'src/pipes/pipes.module';
import { GuidUtils } from 'src/utils/guid.utils';
import { ObjectUtils } from 'src/utils/object.utils';
import { ControlValidators } from 'src/validators/control.validators';
import { PasswordValidator } from 'src/validators/password.validator';
import { ResetPasscodeDto } from '../models/reset-passcode.models';
import { IResetPasswordForm } from '../reset-passcode.form';
import { InvalidResetPasswordTokenComponent } from './invalid-reset-password-token/invalid-reset-password-token.component';
import { ResetPasswordControlComponent } from './reset-password-control/reset-password-control.component';

@Component({
  selector: 'app-reset-password',
  imports: [
    FormsModule,
    PipesModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ResetPasswordControlComponent,
    InvalidResetPasswordTokenComponent,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent extends WithForm<IResetPasswordForm>() {
  public readonly isTokenValid = input.required<boolean>();
  public readonly userEmail = input.required<string | undefined>();
  public readonly userId = input.required<string | undefined>();
  public readonly token = input.required<string | undefined>();

  public constructor(
    formBuilder: FormBuilder,
    private _router: Router,
    private _snackBarService: SnackBarService,
    private _resetPasscodeService: ResetPasscodeService
  ) {
    const formGroup = formBuilder.group<IResetPasswordForm>(
      {
        password: new FormControl(null, { validators: [Validators.required] }),
        confirmPassword: new FormControl(null, {
          validators: [
            Validators.required,
            Validators.minLength(VALIDATOR_SETTINGS.STRONG_PASSWORD_OPTIONS.minLength),
            Validators.maxLength(VALIDATOR_SETTINGS.PASSWORD_MAX_LENGTH),
            PasswordValidator.strong(),
          ],
        }),
      } satisfies IResetPasswordForm,
      {
        validators: [
          ControlValidators.matchControlsValue(
            ObjectUtils.nameOf<IResetPasswordForm>(p => p.password),
            ObjectUtils.nameOf<IResetPasswordForm>(p => p.confirmPassword)
          ),
        ],
      }
    );

    super(formGroup);
  }

  protected save(): void {
    if (!this.isReadyToSubmit() || !GuidUtils.isValidGuid(this.userId())) {
      this.showErrors();
      return;
    }

    this._resetPasscodeService
      .resetPasscode(
        this.userId()!,
        new ResetPasscodeDto(this.token()!, this.controls.password.value)
      )
      .subscribe(response => {
        if (response.isPasscodeSet) {
          this._snackBarService.translateAndShowSuccess({
            message: 'ResetPassword/ResetPasswordSuccess',
            options: {
              duration: SnackBarService.LONG_SUCCESS_DURATION,
            },
          });
        } else {
          this._snackBarService.translateAndShowError({
            message: 'ResetPassword/ResetPasswordFailed',
          });
        }

        this._router.navigateByUrl('/');
      });
  }
}
