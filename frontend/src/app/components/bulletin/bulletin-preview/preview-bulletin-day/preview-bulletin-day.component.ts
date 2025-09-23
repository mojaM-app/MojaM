import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IBulletinDayDto } from '../../interfaces/bulletin';
import { PipesModule } from 'src/pipes/pipes.module';
import { WysiwygPreviewComponent } from 'src/app/components/static/wysiwyg-editor/wysiwyg-preview/wysiwyg-preview.component';

@Component({
  selector: 'app-preview-bulletin-day',
  imports: [PipesModule, WysiwygPreviewComponent],
  templateUrl: './preview-bulletin-day.component.html',
  styleUrl: './preview-bulletin-day.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewBulletinDayComponent {
  public readonly day = input.required<IBulletinDayDto>();
}
