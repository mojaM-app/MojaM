import { ComponentType } from '@angular/cdk/portal';
import { Inject, inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { IS_MOBILE } from 'src/app/app.config';
import { LoginDialogComponent } from 'src/app/components/static/login/login-dialog/login-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private readonly _dialog = inject(MatDialog);

  public constructor(@Inject(IS_MOBILE) private _isMobile: boolean) {}

  public open<T>(component: ComponentType<T>, config?: MatDialogConfig): MatDialogRef<T> {
    return this._dialog.open(component, config);
  }

  public openLoginComponent(): MatDialogRef<LoginDialogComponent> {
    return this.open(LoginDialogComponent, {
      restoreFocus: false,
      width: '90%',
      maxWidth: '35rem',
      position: this._isMobile ? { top: '10%' } : {},
    });
  }
}
