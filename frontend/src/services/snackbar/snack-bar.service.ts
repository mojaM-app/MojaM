import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { concatMap, distinctUntilChanged, map, Observable, of, Subject, tap } from 'rxjs';
import { StringUtils } from 'src/utils/string.utils';
import { TranslationService } from '../translate/translation.service';

export interface IToast {
  message: string;
  action: string;
  config: MatSnackBarConfig;
}

@Injectable({
  providedIn: 'root',
})
export class SnackBarService {
  private _snackBar = inject(MatSnackBar);
  private _emitToast = new Subject<IToast>();

  public constructor(private _translationService: TranslationService) {
    this._emitToast
      .pipe(
        distinctUntilChanged((prev, curr) => StringUtils.ciEquals(prev.message, curr.message)),
        concatMap(toast => this.waitForSnackbarDismiss(toast)),
        tap(toast => this._snackBar.open(toast.message, toast.action, toast.config))
      )
      .subscribe();
  }

  public showError(message: string): void {
    this._emitToast.next({
      message: message,
      action: this._translationService.get('Shared/BtnOk'),
      config: {
        panelClass: ['error'],
      } satisfies MatSnackBarConfig,
    } satisfies IToast);
  }

  private waitForSnackbarDismiss(message: IToast): Observable<IToast> {
    const snackbarRef = this._snackBar._openedSnackBarRef;
    if (snackbarRef) {
      return snackbarRef!.afterDismissed().pipe(map(() => message));
    } else {
      return of(message);
    }
  }
}