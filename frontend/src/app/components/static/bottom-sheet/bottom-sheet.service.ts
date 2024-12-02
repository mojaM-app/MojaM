import { inject, Injectable } from '@angular/core';
import { MatBottomSheet, MatBottomSheetConfig } from '@angular/material/bottom-sheet';
import { BottomSheetComponent } from './bottom-sheet.component';

@Injectable({
  providedIn: 'root',
})
export class BottomSheetService {
  private _bottomSheet = inject(MatBottomSheet);

  public open(config: MatBottomSheetConfig): void {
    this._bottomSheet.open(BottomSheetComponent, config);
  }
}
