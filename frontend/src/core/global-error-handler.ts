/* eslint-disable @typescript-eslint/no-explicit-any */
import { ErrorHandler, Injectable } from '@angular/core';
import { SnackBarService } from 'src/services/snackbar/snack-bar.service';
import { TranslationService } from 'src/services/translate/translation.service';
import { StringUtils } from 'src/utils/string.utils';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  public constructor(
    private _snackBarService: SnackBarService,
    private _translationService: TranslationService
  ) {}

  public handleError(error: any): void {
    let message = error?.message;
    if (
      StringUtils.isString(message) &&
      (message as string).trim().toLowerCase().startsWith('failed to fetch')
    ) {
      message = this._translationService.get('Errors/No_Connection');
    }

    if (error?.status >= 0) {
      switch (error.status) {
        case 0:
          message = this._translationService.get('Errors/No_Connection');
          break;
        case 400:
          message = this._translationService.get('Errors/Bad_Request');
          break;
        case 401:
        case 403:
          message = this._translationService.get('Errors/Unauthorized');
          break;
        case 440:
          message = this._translationService.get('Errors/Session_Expired');
          break;
      }
    }

    if ((message ?? '').length === 0) {
      message = this._translationService.get('Errors/Unhandled_Error');
    }

    this._snackBarService.showError(message);
    console?.error(error);
  }
}
