import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { WysiwygPreviewComponent } from 'src/app/components/static/wysiwyg-editor/wysiwyg-preview/wysiwyg-preview.component';

@Component({
  selector: 'app-preview-bulletin-section',
  imports: [WysiwygPreviewComponent],
  templateUrl: './preview-bulletin-section.component.html',
  styleUrl: './preview-bulletin-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewBulletinSectionComponent {
  public readonly content = input.required<string>();
}
