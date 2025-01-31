import { ErrorHandler, Injectable } from '@angular/core';
import { SnackBarService } from 'src/services/snackbar/snack-bar.service';
import { StringUtils } from 'src/utils/string.utils';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  public constructor(private _snackBarService: SnackBarService) {}

  public handleError(error: any): void {
    let message = error?.errorMessage ?? error?.message;
    if (
      (StringUtils.isString(message) &&
        (message as string).trim().toLowerCase().startsWith('failed to fetch')) ||
      error?.status === 0
    ) {
      message = 'Errors/No_Connection';
    }

    if (!(message?.length ?? 0) && error?.status >= 0) {
      switch (error.status) {
        case 0: // No connection
        case 504: // Gateway Timeout
          message = 'Errors/No_Connection';
          break;
        case 400: // Bad Request
          message = 'Errors/Bad_Request';
          break;
        case 401: // Unauthorized
        case 403: // Forbidden
          message = 'Errors/Unauthorized';
          break;
        case 440: // Session expired
          message = 'Errors/Session_Expired';
          break;
      }
    }

    if ((message ?? '').length === 0) {
      message = 'Errors/Unhandled_Error';
    }

    this._snackBarService.translateAndShowError(message);
    console?.error(error);
  }
}
