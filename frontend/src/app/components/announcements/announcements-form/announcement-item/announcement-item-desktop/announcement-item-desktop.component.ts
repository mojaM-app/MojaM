import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DirectivesModule } from 'src/directives/directives.module';
import { PipesModule } from 'src/pipes/pipes.module';
import { DialogService } from 'src/services/dialog/dialog.service';
import { AnnouncementItemBase } from '../announcement-item.base';

@Component({
  selector: 'app-announcement-item-desktop',
  standalone: true,
  imports: [PipesModule, DirectivesModule, FormsModule],
  templateUrl: './announcement-item-desktop.component.html',
  styleUrl: './announcement-item-desktop.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementItemDesktopComponent extends AnnouncementItemBase {
  public constructor(dialogService: DialogService) {
    super(dialogService);
  }

  public override editItem(): void {}
}
