/* eslint-disable @typescript-eslint/member-ordering */
import { ChangeDetectionStrategy, Component, inject, model } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { IMenuItem } from 'src/interfaces/menu/menu-item';

@Component({
  selector: 'app-bottom-sheet',
  imports: [MatListModule, MatButtonModule, MatIconModule],
  templateUrl: './bottom-sheet.component.html',
  styleUrl: './bottom-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomSheetComponent {
  private readonly _bottomSheetRef =
    inject<MatBottomSheetRef<BottomSheetComponent>>(MatBottomSheetRef);
  private readonly _data = inject<IMenuItem[]>(MAT_BOTTOM_SHEET_DATA);

  public readonly menuItems = model(this._data ?? []);

  public menuItemClick(event: MouseEvent, menuItem: IMenuItem): void {
    let result = undefined;
    if (menuItem.action) {
      result = menuItem.action();
    }
    this._bottomSheetRef.dismiss(result);
    event.preventDefault();
  }

  protected close(): void {
    this._bottomSheetRef.dismiss();
  }
}
