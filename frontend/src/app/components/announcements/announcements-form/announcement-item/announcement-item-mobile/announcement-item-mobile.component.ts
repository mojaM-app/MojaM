import { ChangeDetectionStrategy, Component, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DirectivesModule } from 'src/directives/directives.module';
import { PipesModule } from 'src/pipes/pipes.module';
import { DialogService } from 'src/services/dialog/dialog.service';
import { AnnouncementItemBase } from '../announcement-item.base';

@Component({
  selector: 'app-announcement-item-mobile',
  standalone: true,
  imports: [PipesModule, DirectivesModule, FormsModule, MatButtonModule, MatIconModule],
  templateUrl: './announcement-item-mobile.component.html',
  styleUrl: './announcement-item-mobile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementItemMobileComponent extends AnnouncementItemBase {
  public showOptions: WritableSignal<boolean> = signal<boolean>(false);

  public constructor(private _dialogService: DialogService) {
    super();
  }

  public override editItem(): void {
    const dialogRef = this._dialogService.openWysiwygEditorMobile(this.content() ?? '');

    dialogRef.afterClosed().subscribe((result: string | undefined) => {
      if (result !== undefined) {
        this.setNewContent(result ?? '');
      }
      this.hideOptionsPanel();
    });
  }

  public showOptionsPanel(): void {
    this.showOptions.set(true);
  }

  public hideOptionsPanel(): void {
    this.showOptions.set(false);
  }
}
