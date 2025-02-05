import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { WysiwygPreviewComponent } from 'src/app/components/static/wysiwyg-editor/wysiwyg-preview/wysiwyg-preview.component';
import { PipesModule } from 'src/pipes/pipes.module';
import { IAnnouncementItem } from '../../interfaces/announcements';
import { AnnouncementsItemFooterComponent } from '../announcement-item-footer/announcements-item-footer.component';

@Component({
  selector: 'app-announcements-item',
  templateUrl: './announcements-item.component.html',
  styleUrls: ['./announcements-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PipesModule, MatIconModule, WysiwygPreviewComponent, AnnouncementsItemFooterComponent],
})
export class AnnouncementsItemComponent {
  public readonly item = input.required<IAnnouncementItem>();
}
