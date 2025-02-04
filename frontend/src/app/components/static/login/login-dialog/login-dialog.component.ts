import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PipesModule } from 'src/pipes/pipes.module';
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
})
export class LoginDialogComponent {
  private readonly _dialogRef = inject(MatDialogRef<LoginDialogComponent>);
  private readonly _loginForm = viewChild<LoginFormComponent>('loginForm');
  private readonly _isDialogOpened = signal<boolean>(false);
  private readonly _data = inject<ILoginDialogOptions>(MAT_DIALOG_DATA);

  public constructor() {
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

  public afterLogIn(closeDialog: boolean): void {
    if (closeDialog) {
      this._dialogRef.close();
    }
  }
}
