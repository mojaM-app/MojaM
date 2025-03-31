import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
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
import { ActivatedRoute, Router } from '@angular/router';
import { ResetPasswordService } from 'src/app/components/static/reset-password/services/reset-password.service';
import { SnackBarService } from 'src/app/components/static/snackbar/snack-bar.service';
import { VALIDATOR_SETTINGS } from 'src/core/consts';
import { WithForm } from 'src/mixins/with-form.mixin';
import { PipesModule } from 'src/pipes/pipes.module';
import { GuidUtils } from 'src/utils/guid.utils';
import { ObjectUtils } from 'src/utils/object.utils';
import { ControlValidators } from 'src/validators/control.validators';
import { PasswordValidator } from 'src/validators/password.validator';
import { ICheckResetPasswordTokenResultDto } from './interfaces/reset-password.interfaces';
import { ResetPasswordDto } from './models/reset-password.models';
import { ResetPasswordControlComponent } from './reset-password-control/reset-password-control.component';
import { IResetPasswordForm } from './reset-password.form';

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
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent extends WithForm<IResetPasswordForm>() implements OnInit {
  protected readonly isTokenValid = signal<boolean | null>(null);
  protected readonly userEmail = signal<string | undefined>(undefined);

  public constructor(
    formBuilder: FormBuilder,
    private _route: ActivatedRoute,
    private _router: Router,
    private _snackBarService: SnackBarService,
    private _resetPasswordService: ResetPasswordService
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

  public ngOnInit(): void {
    const params = this._route.snapshot.params;
    const userId = params['userId'];
    const token = params['token'];

    this._resetPasswordService
      .checkResetPasswordToken(userId, token)
      .subscribe((result: ICheckResetPasswordTokenResultDto) => {
        this.isTokenValid.set(result.isValid);
        this.userEmail.set(result.userEmail);
      });
  }

  public changePassword(): void {
    const params = this._route.snapshot.params;
    const userId = params['userId'];
    const token = params['token'];

    if (!this.isReadyToSubmit() || !GuidUtils.isValidGuid(userId)) {
      this.showErrors();
      return;
    }

    this._resetPasswordService
      .resetPassword(userId, new ResetPasswordDto(token, this.controls.password.value))
      .subscribe(response => {
        if (response.isPasswordSet) {
          this._snackBarService.translateAndShowSuccess({
            message: 'Login/ResetPasswordSuccess',
          });
        } else {
          this._snackBarService.translateAndShowError({
            message: 'Login/ResetPasswordFailed',
          });
        }

        this._router.navigateByUrl('/');
      });
  }
}
