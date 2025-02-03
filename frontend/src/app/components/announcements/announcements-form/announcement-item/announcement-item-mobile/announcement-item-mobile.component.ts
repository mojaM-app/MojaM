import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, WritableSignal } from '@angular/core';
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
  selector: 'app-announcement-item-mobile',
  imports: [
    CommonModule,
    PipesModule,
    DirectivesModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    WysiwygPreviewComponent,
  ],
  templateUrl: './announcement-item-mobile.component.html',
  styleUrl: './announcement-item-mobile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementItemMobileComponent extends AnnouncementItemBase {
  public showOptions: WritableSignal<boolean> = signal<boolean>(false);

  public constructor(dialogService: DialogService) {
    super(dialogService);
  }

  public showOptionsPanel(): void {
    this.showOptions.set(true);
  }

  public hideOptionsPanel(): void {
    this.showOptions.set(false);
  }

  protected override afterCloseDialog(): void {
    this.hideOptionsPanel();
  }

  protected override getDialogConfig(): MatDialogConfig {
    return DialogService.getMobileWysiwygEditorDialogConfig();
  }
}
