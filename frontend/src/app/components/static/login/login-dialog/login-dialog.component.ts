import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PipesModule } from 'src/pipes/pipes.module';
import { AuthenticationTypes } from '../../activate-account/enums/authentication-type.enum';
import { RequestResetPasscodeDto } from '../../reset-passcode/models/reset-passcode.models';
import { ResetPasscodeService } from '../../reset-passcode/services/reset-passcode.service';
import { SnackBarService } from '../../snackbar/snack-bar.service';
import { LoginFormComponent } from '../login-form/login-form.component';
import { ILoginDialogOptions } from './login-dialog.options';

@Component({
  selector: 'app-login-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    LoginFormComponent,
    MatIconModule,
    PipesModule,
    CommonModule,
  ],
  templateUrl: './login-dialog.component.html',
  styleUrl: './login-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginDialogComponent {
  private readonly _dialogRef = inject(MatDialogRef<LoginDialogComponent>);
  private readonly _loginForm = viewChild<LoginFormComponent>('loginForm');
  private readonly _isDialogOpened = signal<boolean>(false);
  private readonly _data = inject<ILoginDialogOptions>(MAT_DIALOG_DATA);

  public constructor(
    private _snackBarService: SnackBarService,
    private _resetPasswordService: ResetPasscodeService
  ) {
    this._dialogRef.afterOpened().subscribe(() => {
      this._isDialogOpened.set(true);
    });

    effect(() => {
      if (this._loginForm() && this._isDialogOpened()) {
        this._loginForm()!.focusEmailInput();
        if (this._data?.setLoginData === true) {
          this._loginForm()!.setLoginData();
        }
      }
    });
  }

  protected afterLogIn(closeDialog: boolean): void {
    if (closeDialog) {
      this._dialogRef.close();
    }
  }

  protected afterRequestedResetPasscode({
    dto,
    authType,
  }: {
    dto: RequestResetPasscodeDto;
    authType: AuthenticationTypes | undefined;
  }): void {
    this._dialogRef.close();

    this._resetPasswordService.requestResetPasscode(dto).subscribe(() => {
      switch (authType) {
        case AuthenticationTypes.Password:
          this._snackBarService.translateAndShowSuccess({
            message: 'Login/RequestResetPasswordSent',
          });
          break;
        case AuthenticationTypes.Pin:
          this._snackBarService.translateAndShowSuccess({
            message: 'Login/RequestResetPinSent',
          });
          break;
        default:
          throw new Error('Invalid authentication type');
      }
    });
  }
}
