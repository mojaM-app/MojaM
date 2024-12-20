import { Component, model, ModelSignal } from '@angular/core';

@Component({
  selector: 'app-wysiwyg-preview',
  standalone: true,
  imports: [],
  templateUrl: './wysiwyg-preview.component.html',
  styleUrl: './wysiwyg-preview.component.scss',
})
export class WysiwygPreviewComponent {
  public readonly content: ModelSignal<string> = model.required<string>();
}
