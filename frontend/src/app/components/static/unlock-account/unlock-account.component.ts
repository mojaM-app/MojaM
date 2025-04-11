import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PATHS } from 'src/app/app.routes';
import { GuidUtils } from 'src/utils/guid.utils';
import { NewsMenu } from '../../news/news.menu';
import { SnackBarService } from '../snackbar/snack-bar.service';
import { IUnlockAccountResult } from './interfaces/unlock-account';
import { UnlockAccountService } from './services/unlock-account.service';

@Component({
  selector: 'app-unlock-account',
  imports: [],
  templateUrl: './unlock-account.component.html',
  styleUrl: './unlock-account.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnlockAccountComponent implements OnInit {
  public constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _snackBarService: SnackBarService,
    private _unlockAccountService: UnlockAccountService
  ) {}
  public ngOnInit(): void {
    const params = this._route.snapshot.params;
    const userUuid = params['userId'];

    if (!GuidUtils.isValidGuid(userUuid)) {
      this._router.navigate(['/' + PATHS.NotFound]);
      this._snackBarService.translateAndShowError({
        message: 'Errors/Invalid_Unlocked_Account_Identifier',
      });
      return;
    }

    this._unlockAccountService.unlock(userUuid).subscribe((result: IUnlockAccountResult) => {
      this.navigateToHomePage();
      if (result.success) {
        this._snackBarService.translateAndShowSuccess({
          message: 'UnlockAccount/AccountUnlockedSuccessfully',
        });
      } else {
        this._snackBarService.translateAndShowError({
          message: 'UnlockAccount/UnlockingAccountFailed',
        });
      }
    });
  }

  private navigateToHomePage(): void {
    this._router.navigateByUrl(NewsMenu.Path);
  }
}
