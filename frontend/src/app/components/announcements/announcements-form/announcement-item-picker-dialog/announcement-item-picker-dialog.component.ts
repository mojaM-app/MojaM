import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { PipesModule } from 'src/pipes/pipes.module';
import { IAnnouncementItem } from '../../interfaces/announcements';
import { MatListModule } from '@angular/material/list';
import { WysiwygPreviewComponent } from 'src/app/components/static/wysiwyg-editor/wysiwyg-preview/wysiwyg-preview.component';

@Component({
  selector: 'app-announcement-item-picker-dialog',
  imports: [
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatListModule,
    PipesModule,
    WysiwygPreviewComponent,
  ],
  templateUrl: './announcement-item-picker-dialog.component.html',
  styleUrl: './announcement-item-picker-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementItemPickerDialogComponent {
  public readonly addItemHandler = output<string>();

  protected items = signal<IAnnouncementItem[]>([]);
  private readonly _data = inject(MAT_DIALOG_DATA);

  public constructor(private _dialogRef: MatDialogRef<AnnouncementItemPickerDialogComponent>) {
    this.items.set(this._data.items);
  }

  protected addItem(item: IAnnouncementItem): void {
    this.addItemHandler.emit(item.content);
    this.items.update(items => items.filter(i => i !== item));

    if (this.items().length === 0) {
      this.closeDialog();
    }
  }

  protected closeDialog(): void {
    this._dialogRef.close();
  }
}
