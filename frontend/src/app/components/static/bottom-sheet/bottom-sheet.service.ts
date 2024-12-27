import { Location } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { MatBottomSheet, MatBottomSheetConfig } from '@angular/material/bottom-sheet';
import { Guid } from 'guid-typescript';
import { firstValueFrom, map, tap } from 'rxjs';
import { MenuItemClickResult } from '../../../../interfaces/menu/menu.enum';
import { BottomSheetComponent } from './bottom-sheet.component';

@Injectable({
  providedIn: 'root',
})
export class BottomSheetService {
  private _bottomSheet = inject(MatBottomSheet);

  public constructor(private _location: Location) {}

  public open(config: MatBottomSheetConfig): Promise<MenuItemClickResult | undefined> {
    const currentUrl = this._location.path();
    const newPath = currentUrl + `/menu/${Guid.raw()}`;

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
}
