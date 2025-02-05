import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PipesModule } from 'src/pipes/pipes.module';
import { IAnnouncementItem } from '../../interfaces/announcements';

@Component({
  selector: 'app-announcements-item-footer',
  templateUrl: './announcements-item-footer.component.html',
  styleUrls: ['./announcements-item-footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PipesModule, MatIconModule],
})
export class AnnouncementsItemFooterComponent {
  public readonly item = input.required<IAnnouncementItem>();
}
