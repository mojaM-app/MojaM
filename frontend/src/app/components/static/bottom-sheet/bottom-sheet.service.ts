import { Location } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { MatBottomSheet, MatBottomSheetConfig } from '@angular/material/bottom-sheet';
import { Guid } from 'guid-typescript';
import { firstValueFrom, map, tap } from 'rxjs';
import { BottomSheetComponent } from './bottom-sheet.component';
import { BottomSheetActionResult } from './bottom-sheet.enum';

@Injectable({
  providedIn: 'root',
})
export class BottomSheetService {
  private _bottomSheet = inject(MatBottomSheet);

  public constructor(private _location: Location) {}

  public open(config: MatBottomSheetConfig): Promise<BottomSheetActionResult | undefined> {
    const currentUrl = this._location.path();

    const bottomSheetRef = this._bottomSheet.open(BottomSheetComponent, config);

    bottomSheetRef
      .afterOpened()
      .pipe(tap(() => this._location.go(currentUrl + `/menu/${Guid.raw()}`)))
      .subscribe();

    return firstValueFrom(
      bottomSheetRef.afterDismissed().pipe(
        tap(() => this._location.go(currentUrl)),
        map((result?: BottomSheetActionResult) => result)
      )
    );
  }
}
