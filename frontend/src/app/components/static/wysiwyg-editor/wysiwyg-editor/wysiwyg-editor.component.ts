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

  public model: string = '';

  public constructor() {
    const effectRef = effect(
      () => {
        this.model = this.transformContent(this.content());
        effectRef.destroy();
      },
      { manualCleanup: true }
    );
  }

  protected handleContentChange(ev: ContentChange): void {
    this.content.set(this.transformContent(ev?.html));
  }

  private transformContent(content: string | null | undefined): string {
    return (content ?? '')
      .replace(/(<p><\/p>\s*)+$/, '')
      .replace(/&nbsp;+/gi, ' ')
      .trim()
      .replace(/\s+/gi, ' ')
      .replace(/^\s/gi, '');
  }
}
