import { ComponentType } from '@angular/cdk/portal';
import { Location } from '@angular/common';
import { Inject, inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { Guid } from 'guid-typescript';
import { firstValueFrom, map, tap } from 'rxjs';
import { IS_MOBILE } from 'src/app/app.config';
import { ConfirmDialogComponent } from 'src/app/components/static/confirmation-dialog/confirm-dialog.component';
import { LoginDialogComponent } from 'src/app/components/static/login/login-dialog/login-dialog.component';
import { WysiwygEditorPopupComponent } from 'src/app/components/static/wysiwyg-editor/wysiwyg-editor-dialog/wysiwyg-editor-dialog.component';
import { IDialogSettings } from 'src/interfaces/common/dialog.settings';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private readonly _dialog = inject(MatDialog);

  public constructor(
    @Inject(IS_MOBILE) private _isMobile: boolean,
    private _location: Location
  ) {}

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

  public openWysiwygEditor(
    content: string,
    config: MatDialogConfig
  ): MatDialogRef<WysiwygEditorPopupComponent> {
    const currentUrl = this._location.path();

    const dialogRef = this.open(WysiwygEditorPopupComponent, {
      ...config,
      data: { content },
    } satisfies MatDialogConfig);

    dialogRef
      .afterOpened()
      .pipe(tap(() => this._location.go(currentUrl + `/${Guid.raw()}`)))
      .subscribe();

    dialogRef
      .afterClosed()
      .pipe(tap(() => this._location.go(currentUrl)))
      .subscribe();

    return dialogRef;
  }

  public confirm(settings: IDialogSettings): Promise<boolean> {
    const confirmDialogRef = this._dialog.open(ConfirmDialogComponent, {
      data: settings,
    });

    return firstValueFrom(
      confirmDialogRef.afterClosed().pipe(
        map(confirmResult => {
          return confirmResult === true;
        })
      )
    );
  }

  public static getMobileWysiwygEditorDialogConfig(): MatDialogConfig {
    return {
      restoreFocus: false,
      height: 'calc(100% - 10px)',
      width: 'calc(100% - 10px)',
      maxWidth: '100%',
      maxHeight: '100%',
      position: { top: '5px', left: '5px' },
      autoFocus: false,
      panelClass: ['mobile-wysiwyg-editor-dialog', 'full-size-dialog'],
    } satisfies MatDialogConfig;
  }

  public static getDesktopWysiwygEditorDialogConfig(): MatDialogConfig {
    return {
      restoreFocus: false,
      height: '80%',
      width: '60%',
      maxWidth: '100%',
      maxHeight: '100%',
      position: { top: '5%', left: '20%' },
      autoFocus: false,
      panelClass: ['desktop-wysiwyg-editor-dialog', 'full-size-dialog'],
    } satisfies MatDialogConfig;
  }
}
