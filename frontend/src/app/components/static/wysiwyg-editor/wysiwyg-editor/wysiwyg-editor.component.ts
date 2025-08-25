import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  model,
  ModelSignal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentChange, QuillModule } from 'ngx-quill';
import { PipesModule } from 'src/pipes/pipes.module';
import { WysiwygUtils } from '../wysiwyg.utils';

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

  protected model: string | null = null;

  public constructor() {
    const effectRef = effect(
      () => {
        this.model = WysiwygUtils.clearContent(this.content());
        effectRef.destroy();
      },
      { manualCleanup: true }
    );
  }

  protected handleContentChange(ev: ContentChange): void {
    this.content.set(WysiwygUtils.clearContent(ev?.html));
  }
}
