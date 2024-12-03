import { GdatePipe } from 'src/pipes/gdate.pipe';
import { GdatetimePipe } from 'src/pipes/gdatetime.pipe';
import { GtimePipe } from 'src/pipes/gtime.pipe';
import { PermissionService } from 'src/services/auth/permission.service';
import { DialogService } from 'src/services/dialog/dialog.service';
import { SnackBarService } from 'src/services/snackbar/snack-bar.service';
import { CultureService } from 'src/services/translate/culture.service';
import { TranslationService } from 'src/services/translate/translation.service';

export class BaseGridService {
  protected readonly _datetimePipe: GdatetimePipe;
  protected readonly _datePipe: GdatePipe;
  protected readonly _timePipe: GtimePipe;

  public constructor(
    protected _permissionService: PermissionService,
    protected _dialogService: DialogService,
    protected _translationService: TranslationService,
    protected _snackBarService: SnackBarService,
    cultureService: CultureService
  ) {
    this._datetimePipe = new GdatetimePipe(cultureService, _translationService);
    this._datePipe = new GdatePipe(cultureService, _translationService);
    this._timePipe = new GtimePipe(cultureService, _translationService);
  }
}
