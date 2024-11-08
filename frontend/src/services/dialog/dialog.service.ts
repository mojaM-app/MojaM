import { ComponentType } from '@angular/cdk/portal';
import { Inject, inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { IS_MOBILE } from 'src/app/app.config';
import { LoginDialogComponent } from 'src/app/components/static/login/login-dialog/login-dialog.component';
import { WysiwygEditorPopupComponent } from 'src/app/components/static/wysiwyg-editor/wysiwyg-editor-dialog/wysiwyg-editor-dialog.component';

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

  public openWysiwygEditorMobile(content: string): MatDialogRef<WysiwygEditorPopupComponent> {
    return this.open(WysiwygEditorPopupComponent, {
      restoreFocus: false,
      height: 'calc(100% - 10px)',
      width: 'calc(100% - 10px)',
      maxWidth: '100%',
      maxHeight: '100%',
      position: { top: '5px', left: '5px' },
      autoFocus: false,
      panelClass: ['mobile-wysiwyg-editor-dialog', 'full-size-dialog'],
      data: { content },
    });
  }
}
