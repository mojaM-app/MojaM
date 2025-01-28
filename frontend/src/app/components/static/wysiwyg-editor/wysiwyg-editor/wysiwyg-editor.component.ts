import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  model,
  ModelSignal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { PipesModule } from 'src/pipes/pipes.module';

@Component({
  selector: 'app-wysiwyg-editor',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [QuillModule, CommonModule, FormsModule, PipesModule],
  templateUrl: './wysiwyg-editor.component.html',
  styleUrl: './wysiwyg-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WysiwygEditorComponent {
  public readonly content: ModelSignal<string> = model.required<string>();
}
