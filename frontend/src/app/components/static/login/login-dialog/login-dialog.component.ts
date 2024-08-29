import { CommonModule } from '@angular/common';
import { Component, inject, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PipesModule } from 'src/pipes/pipes.module';
import { LoginFormComponent } from '../login-form/login-form.component';

@Component({
  selector: 'app-login-dialog',
  standalone: true,
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

  public constructor() {
    this._dialogRef.afterOpened().subscribe(() => {
      this._loginForm()?.focusEmailInput();
    });
  }

  public afterLogIn(closeDialog: boolean): void {
    if (closeDialog) {
      this._dialogRef.close();
    }
  }
}
