import { Component, inject } from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetModule,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DirectivesModule } from 'src/directives/directives.module';
import { PipesModule } from 'src/pipes/pipes.module';
import { IUserPermissions } from '../interfaces/user-permissions.interface';
import { PermissionsTreeComponent } from '../permissions-tree/permissions-tree.component';

@Component({
  selector: 'app-bottom-sheet-permissions',
  imports: [
    PipesModule,
    DirectivesModule,
    MatBottomSheetModule,
    MatButtonModule,
    MatIconModule,
    PermissionsTreeComponent,
  ],
  templateUrl: './bottom-sheet-permissions.component.html',
  styleUrl: './bottom-sheet-permissions.component.scss',
})
export class BottomSheetPermissionsComponent {
  protected readonly data = inject<{ user: IUserPermissions }>(MAT_BOTTOM_SHEET_DATA);
  private readonly _bottomSheetRef =
    inject<MatBottomSheetRef<BottomSheetPermissionsComponent>>(MatBottomSheetRef);

  protected close(): void {
    this._bottomSheetRef.dismiss();
  }
}
