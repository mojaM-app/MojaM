import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DirectivesModule } from 'src/directives/directives.module';
import { PipesModule } from 'src/pipes/pipes.module';
import { DialogService } from 'src/services/dialog/dialog.service';
import { AnnouncementItemBase } from '../announcement-item.base';

@Component({
  selector: 'app-announcement-item-mobile',
  standalone: true,
  imports: [PipesModule, DirectivesModule, FormsModule],
  templateUrl: './announcement-item-mobile.component.html',
  styleUrl: './announcement-item-mobile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementItemMobileComponent extends AnnouncementItemBase {
  public constructor(private _dialogService: DialogService) {
    super();
  }

  public override editItem(): void {
    const dialogRef = this._dialogService.openWysiwygEditorMobile(this.content() ?? '');

    dialogRef.afterClosed().subscribe((result: string | undefined) => {
      if (result !== undefined) {
        this.setNewContent(result);
      }
    });
  }
}
