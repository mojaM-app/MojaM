import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PipesModule } from 'src/pipes/pipes.module';
import { WysiwygEditorComponent } from '../wysiwyg-editor/wysiwyg-editor.component';

@Component({
  selector: 'app-wysiwyg-editor-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    PipesModule,
    CommonModule,
    WysiwygEditorComponent,
  ],
  templateUrl: './wysiwyg-editor-dialog.component.html',
  styleUrl: './wysiwyg-editor-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WysiwygEditorPopupComponent {
  private readonly _data = inject(MAT_DIALOG_DATA);

  public readonly content = model(this._data.content);
}
