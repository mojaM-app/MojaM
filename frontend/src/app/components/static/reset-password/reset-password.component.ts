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
import { CheckResetPasswordTokenResult } from 'src/interfaces/auth/auth.models';
import { WithForm } from 'src/mixins/with-form.mixin';
import { PipesModule } from 'src/pipes/pipes.module';
import { ResetPasswordService } from 'src/services/auth/reset-password.service';
import { SnackBarService } from 'src/services/snackbar/snack-bar.service';
import { GuidUtils } from 'src/utils/guid.utils';
import { ControlValidators } from 'src/validators/control.validators';
import { PasswordValidator } from 'src/validators/password.validator';
import { ResetPasswordControlComponent } from './reset-password-control/reset-password-control.component';
import { IResetPasswordForm, ResetPasswordFormControlNames } from './reset-password.form';

@Component({
  selector: 'app-reset-password',
  standalone: true,
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
  public readonly isTokenValid = signal<boolean | null>(null);
  public readonly userEmail = signal<string | undefined>(undefined);
  public readonly formControlNames = ResetPasswordFormControlNames;

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
            Validators.minLength(9),
            Validators.maxLength(50),
            PasswordValidator.strong(),
          ],
        }),
      } satisfies IResetPasswordForm,
      {
        validators: [
          ControlValidators.matchControlsValue(
            ResetPasswordFormControlNames.password,
            ResetPasswordFormControlNames.confirmPassword
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
      .subscribe((result: CheckResetPasswordTokenResult) => {
        this.isTokenValid.set(result.isValid);
        this.userEmail.set(result.userEmail);
      });
  }

  public changePassword(): void {
    const params = this._route.snapshot.params;
    const userId = params['userId'];
    const token = params['token'];

    if (this.isReadyToSubmit() !== true || GuidUtils.isValidGuid(userId) !== true) {
      this.showErrors();
      return;
    }

    this._resetPasswordService
      .resetPassword(userId, token, this.controls.password.value)
      .subscribe(response => {
        if (response.isPasswordSet) {
          this._snackBarService.translateAndShowSuccess('Login/ResetPasswordSuccess');
        } else {
          this._snackBarService.translateAndShowError('Login/ResetPasswordFailed');
        }

        this._router.navigateByUrl('/');
      });
  }
}
