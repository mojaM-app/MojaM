import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogConfig } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { WysiwygPreviewComponent } from 'src/app/components/static/wysiwyg-editor/wysiwyg-preview/wysiwyg-preview.component';
import { DirectivesModule } from 'src/directives/directives.module';
import { PipesModule } from 'src/pipes/pipes.module';
import { DialogService } from 'src/services/dialog/dialog.service';
import { AnnouncementItemBase } from '../announcement-item.base';

@Component({
  selector: 'app-announcement-item-desktop',
  imports: [
    CommonModule,
    PipesModule,
    DirectivesModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    WysiwygPreviewComponent,
  ],
  templateUrl: './announcement-item-desktop.component.html',
  styleUrl: './announcement-item-desktop.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementItemDesktopComponent extends AnnouncementItemBase {
  public constructor(dialogService: DialogService) {
    super(dialogService);
  }

  protected override afterCloseDialog(): void {}

  protected override getDialogConfig(): MatDialogConfig {
    return DialogService.getDesktopWysiwygEditorDialogConfig();
  }
}
