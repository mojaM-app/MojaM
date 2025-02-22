import { Location } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { MatBottomSheet, MatBottomSheetConfig } from '@angular/material/bottom-sheet';
import { firstValueFrom, map, tap } from 'rxjs';
import { GuidUtils } from 'src/utils/guid.utils';
import { MenuItemClickResult } from '../../../../interfaces/menu/menu.enum';
import { BottomSheetPermissionsComponent } from '../../management/permissions/bottom-sheet-permissions/bottom-sheet-permissions.component';
import { IUserPermissions } from '../../management/permissions/interfaces/user-permissions.interface';
import { BottomSheetComponent } from './bottom-sheet.component';

@Injectable({
  providedIn: 'root',
})
export class BottomSheetService {
  private _bottomSheet = inject(MatBottomSheet);

  public constructor(private _location: Location) {}

  public open(config: MatBottomSheetConfig): Promise<MenuItemClickResult | undefined> {
    const currentUrl = this._location.path();
    const newPath = currentUrl + `/menu/${GuidUtils.create()}`;

    const bottomSheetRef = this._bottomSheet.open(BottomSheetComponent, config);

    bottomSheetRef
      .afterOpened()
      .pipe(tap(() => this._location.go(newPath)))
      .subscribe();

    return firstValueFrom(
      bottomSheetRef.afterDismissed().pipe(
        tap(() => {
          if (this._location.path() === newPath) {
            this._location.go(currentUrl);
          }
        }),
        map(result => {
          return result;
        })
      )
    );
  }

  public openUserPermissions(user: IUserPermissions | null | undefined): Promise<void> {
    if (!user) {
      return Promise.resolve();
    }

    const currentUrl = this._location.path();
    const newPath = currentUrl + `/permissions-tree/${user.id}`;

    const bottomSheetRef = this._bottomSheet.open(BottomSheetPermissionsComponent, {
      data: {
        user: user,
      },
      height: '80vh',
    });

    bottomSheetRef
      .afterOpened()
      .pipe(tap(() => this._location.go(newPath)))
      .subscribe();

    return firstValueFrom(
      bottomSheetRef.afterDismissed().pipe(
        tap(() => {
          if (this._location.path() === newPath) {
            this._location.go(currentUrl);
          }
        })
      )
    );
  }
}
