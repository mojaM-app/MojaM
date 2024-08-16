import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { TranslationService } from '../translate/translation.service';

@Injectable({
  providedIn: 'root',
})
export class SnackBarService {
  private _snackBar = inject(MatSnackBar);

  public constructor(private _translationService: TranslationService) {}

  public showError(message: string): void {
    this._snackBar.open(
      message,
      this._translationService.get('Shared/BtnOk'),
      {
        panelClass: ['error'],
      } satisfies MatSnackBarConfig
    );
  }
}
