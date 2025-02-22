import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-wysiwyg-preview',
  imports: [],
  templateUrl: './wysiwyg-preview.component.html',
  styleUrl: './wysiwyg-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WysiwygPreviewComponent {
  public readonly content = input.required<string>();
}
